-- =============================================================================
-- Abyss — 0008: secure the order RPCs + Auth0 identity stamp
--
-- Launch blueprint Phase 1. The desk RPCs are no longer callable with the
-- public anon key: order_list_all / order_advance / order_cancel /
-- order_set_collected (and the now-unused order_list_own) move to
-- service_role-only, invoked exclusively from Auth0-gated server routes.
--
-- order_place stays anon-enabled (guest COD checkout) and learns to stamp the
-- customer's Auth0 subject so /account can show a user their own orders.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Identity stamp on the parent order.
-- ---------------------------------------------------------------------------
alter table public.orders add column if not exists auth0_sub text;

create index if not exists orders_auth0_sub_idx on public.orders (auth0_sub);

-- ---------------------------------------------------------------------------
-- 2. order_place: accept + persist the optional Auth0 subject.
--    (New 9-arg signature; the old 8-arg overload is dropped to leave a single
--    entry point, since DEFAULT only resolves through the 9-arg variant.)
-- ---------------------------------------------------------------------------
create or replace function public.order_place(
  p_items jsonb,
  p_name text,
  p_phone text,
  p_wilaya integer,
  p_commune text,
  p_address text,
  p_shipping_fee numeric,
  p_payment_method text,
  p_auth0_sub text default null
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_order_id uuid;
  v_address_id uuid;
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
    (auth.uid(), p_name, p_phone, p_wilaya, null, p_commune, p_address)
  returning id into v_address_id;

  -- Parent order with a friendly ref. Totals reconcile via the recalc trigger.
  select 'DZ-' || lpad(nextval('public.order_ref_seq')::text, 4, '0') into v_ref;
  insert into public.orders
    (user_id, status, ref, payment_method, shipping_fee, shipping_address_id, auth0_sub)
  values
    (auth.uid(), 'pending', v_ref, p_payment_method::public.payment_method, p_shipping_fee, v_address_id, p_auth0_sub)
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

drop function if exists public.order_place(jsonb, text, text, integer, text, text, numeric, text);

-- ---------------------------------------------------------------------------
-- 3. order_list_by_sub — a caller's own orders (server route looks up the
--    Auth0 `sub`, so the client never scans the global directory).
-- ---------------------------------------------------------------------------
create or replace function public.order_list_by_sub(p_sub text)
returns setof jsonb
language sql
stable
security definer set search_path = public
as $$
  select public.serialize_order(o.id)
  from public.orders o
  where o.auth0_sub = p_sub
  order by o.created_at desc;
$$;

-- ---------------------------------------------------------------------------
-- 4. Grants — anon retains ONLY order_place (guest checkout). Everything else
--    moves behind service_role, reached via the Auth0-gated /api routes.
-- ---------------------------------------------------------------------------
revoke all on function public.order_place(jsonb, text, text, integer, text, text, numeric, text, text) from public;
revoke all on function public.order_list_all() from anon, authenticated, public;
revoke all on function public.order_list_own() from anon, authenticated, public;
revoke all on function public.order_advance(uuid) from anon, authenticated, public;
revoke all on function public.order_cancel(uuid) from anon, authenticated, public;
revoke all on function public.order_set_collected(uuid, boolean) from anon, authenticated, public;
revoke all on function public.order_list_by_sub(text) from public;

grant execute on function public.order_place(jsonb, text, text, integer, text, text, numeric, text, text) to anon, authenticated;
grant execute on function public.order_list_all() to service_role;
grant execute on function public.order_list_own() to service_role;
grant execute on function public.order_advance(uuid) to service_role;
grant execute on function public.order_cancel(uuid) to service_role;
grant execute on function public.order_set_collected(uuid, boolean) to service_role;
grant execute on function public.order_list_by_sub(text) to service_role;

-- ---------------------------------------------------------------------------
-- 5. Drop the 0005/0006 demo-data assumptions that no longer hold: nothing
--    here. The smoke order DZ-1003 stays (harmless, unlinked to any sub).
-- ---------------------------------------------------------------------------