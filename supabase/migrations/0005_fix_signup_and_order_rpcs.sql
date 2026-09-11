-- =============================================================================
-- Abyss — 0005: signup fix + order RPC layer
--
-- Ships the "Auth + Orders to live" sprint's database half:
--   • orders.collected        — COD collection flag for the ops desk
--   • addresses.commune_name  — raw checkout commune string (frontend values
--                               like "Sidi Yahia / Saïd Hamdine" don't match
--                               the seeded communes row names)
--   • order_ref_seq           — drives unique DZ-#### refs
--   • handle_new_user() fix   — signups stopped throwing on profiles.full_name
--   • email auto-confirm      — signUp returns a session instantly (demo UX)
--   • order RPCs              — security definer write/read surface for the
--                               checkout + desk flows (RLS stays strict)
--
-- All RPCs run as the function owner so a guest checkout and the passcode desk
-- can write/read the orders graph atomically without loosening row security.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. orders.collected — COD collection flag used by the desk.
-- ---------------------------------------------------------------------------
alter table public.orders
  add column collected boolean not null default false;

-- ---------------------------------------------------------------------------
-- 2. addresses.commune_name — snapshot the checkout commune string.
-- ---------------------------------------------------------------------------
alter table public.addresses
  add column commune_name text;

-- ---------------------------------------------------------------------------
-- 3. order refs — DZ-#### friendly refs (first order = DZ-1001).
-- ---------------------------------------------------------------------------
create sequence if not exists public.order_ref_seq start with 1001;

-- ---------------------------------------------------------------------------
-- 4. Fix signup profile trigger — the old version inserted only (id) into a
--    table where full_name is NOT NULL, so every auth signup raised.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_name text;
begin
  v_name := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'name', '')), '');

  insert into public.profiles (id, full_name, phone, avatar_url)
  values (
    new.id,
    coalesce(v_name, new.email),
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Email auto-confirm (guarded against auth.config layout drift).
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'auth'
      and table_name = 'config'
      and column_name = 'mailer_autoconfirm'
  ) then
    insert into auth.config (id, mailer_autoconfirm)
    values (1, true)
    on conflict (id) do update
      set mailer_autoconfirm = excluded.mailer_autoconfirm;
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 6. Shared helpers.
-- ---------------------------------------------------------------------------

-- Single frontend-facing status for an order, derived from its vendor_orders.
-- The app displays one status per order; the DB tracks it per vendor (§4).
create or replace function public.order_display_status(p_order_id uuid)
returns text
language sql
stable
security definer set search_path = public
as $$
  select case
    when count(*) = 0 then 'placed'
    when count(*) filter (where status <> 'cancelled') = 0 then 'cancelled'
    when count(*) filter (where status = 'delivered') = count(*) then 'delivered'
    when count(*) filter (where status = 'shipped') > 0 then 'in-transit'
    when count(*) filter (where status = 'processing') > 0 then 'confirmed'
    else 'placed'
  end
  from public.vendor_orders
  where order_id = p_order_id;
$$;

-- Full order graph as a single jsonb document (order + address + items).
create or replace function public.serialize_order(p_order_id uuid)
returns jsonb
language sql
stable
security definer set search_path = public
as $$
  select jsonb_build_object(
    'id', o.id,
    'ref', o.ref,
    'status', public.order_display_status(o.id),
    'collected', o.collected,
    'payment_method', o.payment_method,
    'placed_at', (extract(epoch from o.created_at) * 1000)::bigint,
    'subtotal', coalesce(
      (select sum(vo.subtotal) from public.vendor_orders vo where vo.order_id = o.id),
      0
    ),
    'shipping_fee', o.shipping_fee,
    'total_amount', o.total_amount,
    'customer', jsonb_build_object(
      'name', a.full_name,
      'phone', a.phone,
      'wilaya_id', a.wilaya_id,
      'commune_name', a.commune_name,
      'address_line', a.address_line
    ),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'sku', v.sku,
        'product_slug', p.slug,
        'product_name', p.name,
        'vendor_id', vo.vendor_id,
        'vendor_name', vm.name,
        'size', v.size,
        'quantity', oi.quantity,
        'unit_price', oi.unit_price,
        'subtotal', oi.subtotal
      ) order by v.sku)
      from public.order_items oi
      join public.vendor_orders vo on vo.id = oi.vendor_order_id
      join public.product_variants v on v.id = oi.product_variant_id
      join public.products p on p.id = v.product_id
      join public.vendors vm on vm.id = vo.vendor_id
      where vo.order_id = o.id
    ), '[]'::jsonb)
  )
  from public.orders o
  left join public.addresses a on a.id = o.shipping_address_id
  where o.id = p_order_id;
$$;

revoke all on function public.order_display_status(uuid) from public;
revoke all on function public.serialize_order(uuid) from public;

-- ---------------------------------------------------------------------------
-- 7. order_place — atomic guest checkout.
--
-- p_items: jsonb array of { "sku": …, "qty": … } where sku is the seeded
--   variant sku (`{productSlug}-{size}`, e.g. "ab-01-M"). Prices are taken
--   authoritatively from the DB (variant price_override → product.base_price),
--   never trusted from the client.
-- ---------------------------------------------------------------------------
create or replace function public.order_place(
  p_items jsonb,
  p_name text,
  p_phone text,
  p_wilaya integer,
  p_commune text,
  p_address text,
  p_shipping_fee numeric,
  p_payment_method text
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_order_id uuid;
  v_ref text;
  v_unit_price numeric(12, 2);
  v_variant_id uuid;
  v_vendor_id uuid;
  v_vendor_order_id uuid;
  r_item record;
begin
  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'order_place: p_items must be a non-empty array';
  end if;
  if p_payment_method is null or p_payment_method = '' then
    raise exception 'order_place: p_payment_method is required';
  end if;

  -- Address (guest checkout → no auth.uid() under anon key; that's fine).
  insert into public.addresses
    (user_id, full_name, phone, wilaya_id, commune_id, commune_name, address_line)
  values
    (auth.uid(), p_name, p_phone, p_wilaya, null, p_commune, p_address);

  -- Parent order with a friendly ref. Totals reconcile via the recalc trigger.
  select 'DZ-' || lpad(nextval('public.order_ref_seq')::text, 4, '0') into v_ref;
  insert into public.orders
    (user_id, status, ref, payment_method, shipping_fee)
  values
    (auth.uid(), 'pending', v_ref, p_payment_method::public.payment_method, p_shipping_fee)
  returning id into v_order_id;

  -- One vendor_order per vendor, then a line per item.
  create temp table tmp_order_vo (
    vendor_id uuid primary key,
    vendor_order_id uuid
  ) on commit drop;

  for r_item in
    select (elem ->> 'sku')::text as sku, (elem ->> 'qty')::integer as qty
    from jsonb_array_elements(p_items) elem
  loop
    if r_item.qty is null or r_item.qty <= 0 then
      raise exception 'order_place: item % has an invalid quantity', r_item.sku;
    end if;

    select v.id, p.vendor_id
      into v_variant_id, v_vendor_id
      from public.product_variants v
      join public.products p on p.id = v.product_id
     where v.sku = r_item.sku;

    if not found then
      raise exception 'order_place: unknown sku %', r_item.sku;
    end if;

    if r_item.qty > (select stock_quantity from public.product_variants where id = v_variant_id) then
      raise exception 'order_place: insufficient stock for %', r_item.sku;
    end if;

    -- Resolve the final unit price (override wins, else base price).
    select coalesce(v.price_override, p.base_price)
      into v_unit_price
      from public.product_variants v
      join public.products p on p.id = v.product_id
     where v.id = v_variant_id;

    -- Find (or create) this order's vendor_order for the item's vendor.
    v_vendor_order_id := null;
    select vendor_order_id into v_vendor_order_id
      from tmp_order_vo
     where vendor_id = v_vendor_id;

    if v_vendor_order_id is null then
      insert into public.vendor_orders (order_id, vendor_id, status)
      values (v_order_id, v_vendor_id, 'pending')
      returning id into v_vendor_order_id;

      insert into tmp_order_vo (vendor_id, vendor_order_id)
      values (v_vendor_id, v_vendor_order_id);
    end if;

    insert into public.order_items
      (vendor_order_id, product_variant_id, quantity, unit_price, subtotal)
    values
      (v_vendor_order_id, v_variant_id, r_item.qty, v_unit_price, round(v_unit_price * r_item.qty, 2));

    update public.product_variants
       set stock_quantity = stock_quantity - r_item.qty
     where id = v_variant_id;
  end loop;

  -- Payment attempt row (COD pending until the courier collects).
  insert into public.payments (order_id, method, status, amount)
  select v_order_id, p_payment_method::public.payment_method, 'pending', total_amount
    from public.orders
   where id = v_order_id;

  return public.serialize_order(v_order_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. order_list_own — the authenticated caller's orders (empty under anon).
--    order_list_all — every order with full contact data. Deliberately open
--    for the demo desk; see DATABASE.md §9 before anything public.
-- ---------------------------------------------------------------------------
create or replace function public.order_list_own()
returns setof jsonb
language sql
stable
security definer set search_path = public
as $$
  select public.serialize_order(o.id)
  from public.orders o
  where o.user_id = auth.uid()
  order by o.created_at desc;
$$;

create or replace function public.order_list_all()
returns setof jsonb
language sql
stable
security definer set search_path = public
as $$
  select public.serialize_order(o.id)
  from public.orders o
  order by o.created_at desc;
$$;

-- ---------------------------------------------------------------------------
-- 9. Desk mutations.
-- ---------------------------------------------------------------------------

-- Advance every open vendor sub-order one step, then reconcile the parent.
create or replace function public.order_advance(p_order_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.vendor_orders
     set status = case status
       when 'pending' then 'processing'
       when 'processing' then 'shipped'
       when 'shipped' then 'delivered'
       else status
     end
   where order_id = p_order_id
     and status in ('pending', 'processing', 'shipped');

  update public.orders o
     set status = case
       when not exists (
         select 1 from public.vendor_orders vo
         where vo.order_id = o.id and vo.status <> 'cancelled'
       ) then 'cancelled'
       when not exists (
         select 1 from public.vendor_orders vo
         where vo.order_id = o.id and vo.status <> 'delivered'
       ) then 'completed'
       when exists (
         select 1 from public.vendor_orders vo
         where vo.order_id = o.id and vo.status in ('processing', 'shipped')
       ) then 'confirmed'
       else 'pending'
     end
   where o.id = p_order_id;
end;
$$;

-- Cancel all open vendor sub-orders (delivered ones stay delivered).
create or replace function public.order_cancel(p_order_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.vendor_orders
     set status = 'cancelled'
   where order_id = p_order_id
     and status in ('pending', 'processing', 'shipped');

  update public.orders o
     set status = 'cancelled',
         collected = false
   where o.id = p_order_id
     and not exists (
       select 1 from public.vendor_orders vo
       where vo.order_id = p_order_id and vo.status = 'delivered'
     );
end;
$$;

-- Toggle the COD collection flag on the parent order.
create or replace function public.order_set_collected(p_order_id uuid, p_collected boolean)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.orders
     set collected = p_collected
   where id = p_order_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 10. Grants — the write surface is anon + authenticated only.
-- ---------------------------------------------------------------------------
revoke all on function public.order_place(jsonb, text, text, integer, text, text, numeric, text) from public;
revoke all on function public.order_list_own() from public;
revoke all on function public.order_list_all() from public;
revoke all on function public.order_advance(uuid) from public;
revoke all on function public.order_cancel(uuid) from public;
revoke all on function public.order_set_collected(uuid, boolean) from public;

grant execute on function public.order_place(jsonb, text, text, integer, text, text, numeric, text) to anon, authenticated;
grant execute on function public.order_list_own() to anon, authenticated;
grant execute on function public.order_list_all() to anon, authenticated;
grant execute on function public.order_advance(uuid) to anon, authenticated;
grant execute on function public.order_cancel(uuid) to anon, authenticated;
grant execute on function public.order_set_collected(uuid, boolean) to anon, authenticated;