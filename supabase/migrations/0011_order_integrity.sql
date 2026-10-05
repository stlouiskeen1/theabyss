-- =============================================================================
-- Abyss — 0011: order integrity (Phase 3, launch blueprint)
--
-- Targets the four remaining order-integrity gaps:
--   • shipping fee is recomputed server-side (the client's p_shipping_fee is
--     ignored — the store's rule "flat 8, free over 150" mirrors
--     lib/wilayas.ts deliveryFeeFor() exactly);
--   • totals are derived server-side end-to-end (subtotal from DB prices,
--     parent total = subtotal + server fee);
--   • the stock check in order_place now takes a row lock
--     (SELECT … FOR UPDATE) so two guest checkouts can't oversell the last
--     unit (TOCTOU removed);
--   • order_cancel returns the cancelled lines' stock (once, idempotently).
-- Plus input hardening (name/phone/wilaya/commune/address/qty/sku caps) and a
-- basic anon spam guard (rate limit by normalized phone).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. delivery_fee_for — single source of truth for the COD delivery fee.
--    Mirrors lib/wilayas.ts: DELIVERY_FEE = 8, FREE_DELIVERY_OVER = 150.
--    Private — callable only via the security definer RPCs below.
-- ---------------------------------------------------------------------------
create or replace function public.delivery_fee_for(p_subtotal numeric)
returns numeric
language sql
stable
set search_path = public
as $$
  select case
    when p_subtotal is null or p_subtotal <= 0 or p_subtotal >= 150 then 0
    else 8
  end;
$$;

revoke all on function public.delivery_fee_for(numeric) from public;
revoke all on function public.delivery_fee_for(numeric) from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. order_items.stock_restored — makes stock restoration idempotent.
--    Cancelling restores each cancelled line's stock exactly once; a retried
--    /api/ops cancel call must not re-inflate the count.
-- ---------------------------------------------------------------------------
alter table public.order_items
  add column stock_restored boolean not null default false;

-- ---------------------------------------------------------------------------
-- 3. order_place — same 9-arg signature (guest checkout keeps working; the
--    client still sends p_shipping_fee for compatibility, but it is IGNORED).
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
  v_subtotal numeric(12, 2) := 0;
  v_shipping_fee numeric(12, 2);
  v_stock integer;
  v_phone text;
  v_recent integer;
  r_item record;
begin
  -- ---- Transaction basics ------------------------------------------------
  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'order_place: p_items must be a non-empty array';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'order_place: at most 50 line items per order';
  end if;
  if p_payment_method is null or p_payment_method = '' then
    raise exception 'order_place: p_payment_method is required';
  end if;
  if p_payment_method <> 'cod' then
    raise exception 'order_place: only cash-on-delivery (cod) is supported';
  end if;

  -- ---- Input hardening ---------------------------------------------------
  if p_name is null or btrim(p_name) = '' then
    raise exception 'order_place: name is required';
  end if;
  if length(p_name) > 100 then
    raise exception 'order_place: name is too long';
  end if;

  -- Phone: normalize before validating/storing so +213 550 12 34 56 and
  -- 0550123456 are the same number for the rate limit.
  v_phone := regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g');
  if v_phone = '' then
    raise exception 'order_place: phone is required';
  end if;
  if v_phone !~ '^(\+?[0-9]{8,14})$' then
    raise exception 'order_place: phone must be 8-14 digits, optional + prefix';
  end if;

  if p_wilaya is null or not exists (
    select 1 from public.wilayas w where w.code = p_wilaya
  ) then
    raise exception 'order_place: unknown wilaya';
  end if;

  if p_commune is null or btrim(p_commune) = '' then
    raise exception 'order_place: commune is required';
  end if;
  if length(p_commune) > 120 then
    raise exception 'order_place: commune is too long';
  end if;

  if p_address is null or btrim(p_address) = '' then
    raise exception 'order_place: address is required';
  end if;
  if length(p_address) > 300 then
    raise exception 'order_place: address is too long';
  end if;

  if p_auth0_sub is not null and length(p_auth0_sub) > 100 then
    raise exception 'order_place: auth0_sub is too long';
  end if;

  -- ---- Line items: normalize into a deduped temp table -------------------
  create temp table tmp_items (sku text primary key, qty integer) on commit drop;

  if exists (
    select 1
    from jsonb_array_elements(p_items) elem
    where elem ->> 'sku' is null or elem ->> 'qty' is null
  ) then
    raise exception 'order_place: every line item needs a sku and a qty';
  end if;

  insert into tmp_items (sku, qty)
  select (elem ->> 'sku')::text, (elem ->> 'qty')::integer
    from jsonb_array_elements(p_items) elem
  on conflict (sku) do nothing;

  if (select count(*) from tmp_items) <> jsonb_array_length(p_items) then
    raise exception 'order_place: duplicate sku in items';
  end if;

  -- ---- Basic spam guard (anon calls order_place directly, so the rate
  --      limit lives here, not on an /api route) -----------------------------
  select count(*)
    into v_recent
    from public.orders o
    join public.addresses a on a.id = o.shipping_address_id
   where regexp_replace(a.phone, '[^0-9+]', '', 'g') = v_phone
     and o.status in ('pending', 'confirmed')
     and o.created_at > now() - interval '30 minutes';

  if v_recent >= 5 then
    raise exception 'order_place: too many recent orders, please try again later';
  end if;

  -- ---- Address (guest checkout → no auth.uid() under anon key) ------------
  insert into public.addresses
    (user_id, full_name, phone, wilaya_id, commune_id, commune_name, address_line)
  values
    (auth.uid(), btrim(p_name), v_phone, p_wilaya, null, btrim(p_commune), btrim(p_address))
  returning id into v_address_id;

  -- Parent order with a friendly ref. shipping_fee is written later once the
  -- subtotal is known; the top-level order_place call runs in one transaction
  -- so no reader can observe the intermediate 0.
  select 'DZ-' || lpad(nextval('public.order_ref_seq')::text, 4, '0') into v_ref;
  insert into public.orders
    (user_id, status, ref, payment_method, shipping_fee, shipping_address_id, auth0_sub)
  values
    (auth.uid(), 'pending', v_ref, p_payment_method::public.payment_method, 0, v_address_id, p_auth0_sub)
  returning id into v_order_id;

  -- One vendor_order per vendor, then a line per item.
  create temp table tmp_order_vo (
    vendor_id uuid primary key,
    vendor_order_id uuid
  ) on commit drop;

  for r_item in select sku, qty from tmp_items
  loop
    if r_item.qty < 1 or r_item.qty > 99 then
      raise exception 'order_place: item % has an invalid quantity', r_item.sku;
    end if;
    if r_item.sku = '' then
      raise exception 'order_place: item sku cannot be empty';
    end if;

    select v.id, p.vendor_id
      into v_variant_id, v_vendor_id
      from public.product_variants v
      join public.products p on p.id = v.product_id
     where v.sku = r_item.sku;

    if not found then
      raise exception 'order_place: unknown sku %', r_item.sku;
    end if;

    -- Row-locked stock read + capacity check (removes the TOCTOU race with
    -- concurrent guest checkouts; the lock is held until commit).
    select stock_quantity
      into v_stock
      from public.product_variants
     where id = v_variant_id
       for update;

    if r_item.qty > v_stock then
      raise exception 'order_place: insufficient stock for %', r_item.sku;
    end if;

    -- Resolve the final unit price (override wins, else base price). The DB is
    -- the only source of truth for money.
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

    v_subtotal := v_subtotal + round(v_unit_price * r_item.qty, 2);
  end loop;

  -- ---- Server-side fee + totals (client p_shipping_fee is never trusted) --
  v_shipping_fee := public.delivery_fee_for(v_subtotal);

  update public.orders
     set shipping_fee = v_shipping_fee,
         total_amount = v_subtotal + v_shipping_fee
   where id = v_order_id;

  -- Payment attempt row (COD pending until the courier collects), with the
  -- fully-reconciled total.
  insert into public.payments (order_id, method, status, amount)
  values
    (v_order_id, p_payment_method::public.payment_method, 'pending', v_subtotal + v_shipping_fee);

  return public.serialize_order(v_order_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. order_cancel — restore stock for the lines of the cancelled sub-orders.
--    Idempotent: a line is only restored once (order_items.stock_restored).
--    Delivered sub-orders are untouched, so delivered stock stays sold.
-- ---------------------------------------------------------------------------
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

  -- Restore the stock of exactly the lines that were just cancelled, once.
  update public.product_variants pv
     set stock_quantity = pv.stock_quantity + oi.quantity
    from public.order_items oi
    join public.vendor_orders vo on vo.id = oi.vendor_order_id
   where vo.order_id = p_order_id
     and vo.status = 'cancelled'
     and oi.stock_restored = false;

  update public.order_items oi
     set stock_restored = true
    from public.vendor_orders vo
   where vo.id = oi.vendor_order_id
     and vo.order_id = p_order_id
     and vo.status = 'cancelled'
     and oi.stock_restored = false;

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

-- ---------------------------------------------------------------------------
-- 5. Grants. CREATE OR REPLACE preserves order_place/order_cancel privileges
--    from 0008 (anon+authenticated → order_place; service_role → the rest).
--    delivery_fee_for is revoked from every role above (internal helper).
-- ---------------------------------------------------------------------------