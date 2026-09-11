-- =============================================================================
-- Abyss — 0006: fix order_place shipping_address_id
--
-- 0005's order_place stored the delivery address row but never linked it to the
-- parent order (orders.shipping_address_id stayed null), so serialize_order's
-- "customer" object rendered all nulls. Redefines order_place to bind the
-- address, and removes the 0005 smoke-test order (its address is orphaned).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Redefine order_place with the address link.
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
    (user_id, status, ref, payment_method, shipping_fee, shipping_address_id)
  values
    (auth.uid(), 'pending', v_ref, p_payment_method::public.payment_method, p_shipping_fee, v_address_id)
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
-- 2. Drop the 0005 smoke-test order (it was created by a manual anon-key call
--    to verify the RPCs; its address row is orphaned by the bug above).
-- ---------------------------------------------------------------------------
delete from public.orders where ref = 'DZ-1001';

-- Sweep the addresses left dangling by that smoke test.
delete from public.addresses a
where not exists (
  select 1 from public.orders o where o.shipping_address_id = a.id
);