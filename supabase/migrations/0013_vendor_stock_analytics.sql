-- =============================================================================
-- Abyss — 0013: vendor stock management + analytics RPCs
--
-- Extends the seller desk (0012). Same access pattern: the public schema is
-- locked down, so every write/read goes through SECURITY DEFINER RPCs called
-- with the session user id from server routes (service_role):
--
--   • vendor_products_list   — products with variants + images + totals
--   • vendor_product_upsert  — create / edit a product (draft by default)
--   • vendor_product_archive — hide a product (reversible, keeps history)
--   • vendor_product_delete  — hard delete only when it never sold
--   • vendor_variant_upsert  — create / edit a size-color variant
--   • vendor_variant_delete  — delete a variant only when it never sold
--   • vendor_stock_set       — fast stock stepper for one variant
--   • vendor_analytics       — sold / revenue / cancelled / daily / top
--
-- NOTE: there is no returns flow in the order machine yet — cancelled
-- sub-orders are reported as the "cancelled" line. A real returns feature
-- can be layered on later without touching these RPCs.
-- =============================================================================

-- Ownership helper: the vendor belongs to the caller.
create or replace function public.vendor_owned(p_owner uuid, p_vendor_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$ select exists (
  select 1 from public.vendors where id = p_vendor_id and owner_id = p_owner
) $$;

revoke all on function public.vendor_owned(uuid, uuid) from public;
revoke all on function public.vendor_owned(uuid, uuid) from anon, authenticated;
grant execute on function public.vendor_owned(uuid, uuid) to service_role;

-- ---------------------------------------------------------------------------
-- 1. vendor_products_list — full stock payload for the desk.
-- ---------------------------------------------------------------------------
create or replace function public.vendor_products_list(p_owner uuid, p_vendor_id uuid)
returns jsonb[]
language plpgsql
stable
security definer set search_path = public
as $$
begin
  if not public.vendor_owned(p_owner, p_vendor_id) then
    raise exception 'vendor_products_list: forbidden';
  end if;
  return (
    select coalesce(array_agg(to_jsonb(t) order by t.created_at desc), '{}')
    from (
      select
        p.id, p.name, p.slug, p.description, p.brand,
        p.base_price, p.currency, p.status, p.created_at,
        (select coalesce(jsonb_agg(to_jsonb(v) order by v.created_at), '[]')
         from public.product_variants v where v.product_id = p.id) as variants,
        (select coalesce(jsonb_agg(to_jsonb(i) order by i.position), '[]')
         from public.product_images i where i.product_id = p.id) as images,
        (select coalesce(sum(v.stock_quantity), 0)
         from public.product_variants v where v.product_id = p.id) as stock_total,
        (select coalesce(sum(oi.quantity), 0)
         from public.order_items oi
         join public.product_variants v on v.id = oi.product_variant_id
         join public.vendor_orders vo on vo.id = oi.vendor_order_id
         where v.product_id = p.id and vo.status <> 'cancelled') as sold_units
      from public.products p
      where p.vendor_id = p_vendor_id
      order by p.created_at desc
    ) t
  );
end;
$$;

revoke all on function public.vendor_products_list(uuid, uuid) from public;
revoke all on function public.vendor_products_list(uuid, uuid) from anon, authenticated;
grant execute on function public.vendor_products_list(uuid, uuid) to service_role;

-- ---------------------------------------------------------------------------
-- 2. vendor_product_upsert — create (p_product_id null) or edit a product.
-- ---------------------------------------------------------------------------
create or replace function public.vendor_product_upsert(
  p_owner uuid,
  p_vendor_id uuid,
  p_product_id uuid default null,
  p_name text default null,
  p_slug text default null,
  p_description text default null,
  p_brand text default null,
  p_base_price numeric default null,
  p_status text default null,
  p_image_url text default null
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_name text := nullif(btrim(coalesce(p_name, '')), '');
  v_slug text := lower(nullif(btrim(coalesce(p_slug, '')), ''));
  v_desc text := nullif(btrim(coalesce(p_description, '')), '');
  v_brand text := nullif(btrim(coalesce(p_brand, '')), '');
  v_img text := nullif(btrim(coalesce(p_image_url, '')), '');
  v_id uuid;
begin
  if not public.vendor_owned(p_owner, p_vendor_id) then
    raise exception 'vendor_product_upsert: forbidden';
  end if;
  if p_product_id is not null and not exists (
    select 1 from public.products where id = p_product_id and vendor_id = p_vendor_id
  ) then
    raise exception 'vendor_product_upsert: forbidden';
  end if;
  if v_name is null or char_length(v_name) < 2 or char_length(v_name) > 120 then
    raise exception 'vendor_product_upsert: name must be 2-120 characters';
  end if;
  if v_slug is null or v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    or char_length(v_slug) < 3 or char_length(v_slug) > 80 then
    raise exception 'vendor_product_upsert: bad slug';
  end if;
  if p_base_price is null or p_base_price < 0 or p_base_price > 100000000 then
    raise exception 'vendor_product_upsert: bad price';
  end if;
  if p_status is not null and p_status not in ('draft', 'active', 'archived') then
    raise exception 'vendor_product_upsert: bad status';
  end if;
  if v_desc is not null and char_length(v_desc) > 5000 then
    raise exception 'vendor_product_upsert: description too long';
  end if;
  if exists (
    select 1 from public.products
    where slug = v_slug and (p_product_id is null or id <> p_product_id)
  ) then
    raise exception 'vendor_product_upsert: slug_taken';
  end if;

  if p_product_id is null then
    insert into public.products (vendor_id, name, slug, description, brand, base_price, status)
    values (p_vendor_id, v_name, v_slug, v_desc, v_brand, p_base_price, coalesce(p_status, 'draft'))
    returning id into v_id;
    -- First variant so the product is orderable + stock-tracked from day one.
    insert into public.product_variants (product_id, size, sku, stock_quantity)
    values (v_id, 'OS', v_slug || '-os-' || left(md5(random()::text), 6), 0);
  else
    update public.products
    set name = v_name, slug = v_slug, description = v_desc, brand = v_brand,
        base_price = p_base_price,
        status = coalesce(p_status, status)
    where id = p_product_id;
    v_id := p_product_id;
  end if;

  if v_img is not null then
    if exists (select 1 from public.product_images where product_id = v_id) then
      update public.product_images set url = v_img
      where id = (select id from public.product_images where product_id = v_id order by position limit 1);
    else
      insert into public.product_images (product_id, url, position) values (v_id, v_img, 0);
    end if;
  end if;

  return (select to_jsonb(p) from public.products p where p.id = v_id);
end;
$$;

revoke all on function public.vendor_product_upsert(uuid, uuid, uuid, text, text, text, text, numeric, text, text) from public;
revoke all on function public.vendor_product_upsert(uuid, uuid, uuid, text, text, text, text, numeric, text, text) from anon, authenticated;
grant execute on function public.vendor_product_upsert(uuid, uuid, uuid, text, text, text, text, numeric, text, text) to service_role;

-- ---------------------------------------------------------------------------
-- 3. vendor_product_archive — reversible hide (history preserved).
-- ---------------------------------------------------------------------------
create or replace function public.vendor_product_archive(p_owner uuid, p_product_id uuid)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_vendor uuid;
begin
  select vendor_id into v_vendor from public.products where id = p_product_id;
  if v_vendor is null or not public.vendor_owned(p_owner, v_vendor) then
    raise exception 'vendor_product_archive: forbidden';
  end if;
  update public.products set status = 'archived' where id = p_product_id;
  return (select to_jsonb(p) from public.products p where p.id = p_product_id);
end;
$$;

revoke all on function public.vendor_product_archive(uuid, uuid) from public;
revoke all on function public.vendor_product_archive(uuid, uuid) from anon, authenticated;
grant execute on function public.vendor_product_archive(uuid, uuid) to service_role;

-- ---------------------------------------------------------------------------
-- 4. vendor_product_delete — hard delete only when it never sold.
-- ---------------------------------------------------------------------------
create or replace function public.vendor_product_delete(p_owner uuid, p_product_id uuid)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  v_vendor uuid;
begin
  select vendor_id into v_vendor from public.products where id = p_product_id;
  if v_vendor is null or not public.vendor_owned(p_owner, v_vendor) then
    raise exception 'vendor_product_delete: forbidden';
  end if;
  if exists (
    select 1 from public.order_items oi
    join public.product_variants v on v.id = oi.product_variant_id
    where v.product_id = p_product_id
  ) then
    raise exception 'vendor_product_delete: has_orders';
  end if;
  delete from public.products where id = p_product_id;
  return true;
end;
$$;

revoke all on function public.vendor_product_delete(uuid, uuid) from public;
revoke all on function public.vendor_product_delete(uuid, uuid) from anon, authenticated;
grant execute on function public.vendor_product_delete(uuid, uuid) to service_role;

-- ---------------------------------------------------------------------------
-- 5. vendor_variant_upsert — create / edit a size-color variant.
-- ---------------------------------------------------------------------------
create or replace function public.vendor_variant_upsert(
  p_owner uuid,
  p_product_id uuid,
  p_variant_id uuid default null,
  p_size text default null,
  p_color text default null,
  p_sku text default null,
  p_price_override numeric default null,
  p_stock_quantity integer default null
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_vendor uuid;
  v_sku text := nullif(btrim(coalesce(p_sku, '')), '');
  v_id uuid;
begin
  select vendor_id into v_vendor from public.products where id = p_product_id;
  if v_vendor is null or not public.vendor_owned(p_owner, v_vendor) then
    raise exception 'vendor_variant_upsert: forbidden';
  end if;
  if p_stock_quantity is not null and (p_stock_quantity < 0 or p_stock_quantity > 1000000) then
    raise exception 'vendor_variant_upsert: bad stock';
  end if;
  if p_price_override is not null and (p_price_override < 0 or p_price_override > 100000000) then
    raise exception 'vendor_variant_upsert: bad price';
  end if;
  if v_sku is not null and exists (
    select 1 from public.product_variants
    where sku = v_sku and (p_variant_id is null or id <> p_variant_id)
  ) then
    raise exception 'vendor_variant_upsert: sku_taken';
  end if;

  if p_variant_id is null then
    if v_sku is null then
      v_sku := (select slug from public.products where id = p_product_id)
        || '-' || left(md5(random()::text), 6);
    end if;
    insert into public.product_variants (product_id, size, color, sku, price_override, stock_quantity)
    values (p_product_id, nullif(btrim(coalesce(p_size, '')), ''),
            nullif(btrim(coalesce(p_color, '')), ''), v_sku,
            p_price_override, coalesce(p_stock_quantity, 0))
    returning id into v_id;
  else
    if not exists (select 1 from public.product_variants where id = p_variant_id and product_id = p_product_id) then
      raise exception 'vendor_variant_upsert: forbidden';
    end if;
    update public.product_variants
    set size = coalesce(nullif(btrim(coalesce(p_size, size, '')), ''), size),
        color = coalesce(nullif(btrim(coalesce(p_color, color, '')), ''), color),
        sku = coalesce(v_sku, sku),
        price_override = p_price_override,
        stock_quantity = coalesce(p_stock_quantity, stock_quantity)
    where id = p_variant_id;
    v_id := p_variant_id;
  end if;
  return (select to_jsonb(v) from public.product_variants v where v.id = v_id);
end;
$$;

revoke all on function public.vendor_variant_upsert(uuid, uuid, uuid, text, text, text, numeric, integer) from public;
revoke all on function public.vendor_variant_upsert(uuid, uuid, uuid, text, text, text, numeric, integer) from anon, authenticated;
grant execute on function public.vendor_variant_upsert(uuid, uuid, uuid, text, text, text, numeric, integer) to service_role;

-- ---------------------------------------------------------------------------
-- 6. vendor_variant_delete — only when it never sold.
-- ---------------------------------------------------------------------------
create or replace function public.vendor_variant_delete(p_owner uuid, p_variant_id uuid)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  v_product uuid;
  v_vendor uuid;
begin
  select product_id into v_product from public.product_variants where id = p_variant_id;
  if v_product is null then
    raise exception 'vendor_variant_delete: not_found';
  end if;
  select vendor_id into v_vendor from public.products where id = v_product;
  if v_vendor is null or not public.vendor_owned(p_owner, v_vendor) then
    raise exception 'vendor_variant_delete: forbidden';
  end if;
  if exists (select 1 from public.order_items where product_variant_id = p_variant_id) then
    raise exception 'vendor_variant_delete: has_orders';
  end if;
  if (select count(*) from public.product_variants where product_id = v_product) <= 1 then
    raise exception 'vendor_variant_delete: last_variant';
  end if;
  delete from public.product_variants where id = p_variant_id;
  return true;
end;
$$;

revoke all on function public.vendor_variant_delete(uuid, uuid) from public;
revoke all on function public.vendor_variant_delete(uuid, uuid) from anon, authenticated;
grant execute on function public.vendor_variant_delete(uuid, uuid) to service_role;

-- ---------------------------------------------------------------------------
-- 7. vendor_stock_set — fast stepper for one variant.
-- ---------------------------------------------------------------------------
create or replace function public.vendor_stock_set(p_owner uuid, p_variant_id uuid, p_stock integer)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_product uuid;
  v_vendor uuid;
begin
  if p_stock is null or p_stock < 0 or p_stock > 1000000 then
    raise exception 'vendor_stock_set: bad stock';
  end if;
  select product_id into v_product from public.product_variants where id = p_variant_id;
  if v_product is null then
    raise exception 'vendor_stock_set: not_found';
  end if;
  select vendor_id into v_vendor from public.products where id = v_product;
  if v_vendor is null or not public.vendor_owned(p_owner, v_vendor) then
    raise exception 'vendor_stock_set: forbidden';
  end if;
  update public.product_variants set stock_quantity = p_stock where id = p_variant_id;
  return (select to_jsonb(v) from public.product_variants v where v.id = p_variant_id);
end;
$$;

revoke all on function public.vendor_stock_set(uuid, uuid, integer) from public;
revoke all on function public.vendor_stock_set(uuid, uuid, integer) from anon, authenticated;
grant execute on function public.vendor_stock_set(uuid, uuid, integer) to service_role;

-- ---------------------------------------------------------------------------
-- 8. vendor_analytics — desk numbers for the last p_days (default 30).
-- ---------------------------------------------------------------------------
create or replace function public.vendor_analytics(p_owner uuid, p_vendor_id uuid, p_days integer default 30)
returns jsonb
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_days integer := greatest(1, least(coalesce(p_days, 30), 365));
begin
  if not public.vendor_owned(p_owner, p_vendor_id) then
    raise exception 'vendor_analytics: forbidden';
  end if;
  return jsonb_build_object(
    'totals', (
      select jsonb_build_object(
        'suborders', count(*),
        'units', coalesce(sum((select coalesce(sum(oi.quantity), 0)
          from public.order_items oi where oi.vendor_order_id = vo.id)), 0),
        'revenue', coalesce(sum(vo.subtotal), 0),
        'commission', coalesce(sum(vo.commission_amount), 0),
        'delivered', count(*) filter (where vo.status = 'delivered'),
        'cancelled', count(*) filter (where vo.status = 'cancelled')
      )
      from public.vendor_orders vo
      where vo.vendor_id = p_vendor_id
        and vo.created_at >= now() - (v_days || ' days')::interval
    ),
    'by_status', (
      select coalesce(jsonb_agg(jsonb_build_object('status', status, 'count', count)), '[]')
      from (
        select vo.status as status, count(*) as count
        from public.vendor_orders vo
        where vo.vendor_id = p_vendor_id
          and vo.created_at >= now() - (v_days || ' days')::interval
        group by vo.status
      ) s
    ),
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'day', d.day, 'revenue', d.revenue, 'units', d.units, 'orders', d.orders
      ) order by d.day), '[]')
      from (
        select to_char(vo.created_at, 'YYYY-MM-DD') as day,
               coalesce(sum(vo.subtotal), 0) as revenue,
               coalesce(sum((select coalesce(sum(oi.quantity), 0)
                 from public.order_items oi where oi.vendor_order_id = vo.id)), 0) as units,
               count(*) as orders
        from public.vendor_orders vo
        where vo.vendor_id = p_vendor_id
          and vo.created_at >= now() - (v_days || ' days')::interval
        group by 1
      ) d
    ),
    'top_products', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'name', t.name, 'units', t.units, 'revenue', t.revenue
      ) order by t.units desc), '[]')
      from (
        select p.name as name,
               coalesce(sum(oi.quantity), 0) as units,
               coalesce(sum(oi.subtotal), 0) as revenue
        from public.order_items oi
        join public.product_variants v on v.id = oi.product_variant_id
        join public.products p on p.id = v.product_id
        join public.vendor_orders vo on vo.id = oi.vendor_order_id
        where p.vendor_id = p_vendor_id
          and vo.status <> 'cancelled'
          and vo.created_at >= now() - (v_days || ' days')::interval
        group by p.name
        order by units desc
        limit 10
      ) t
    )
  );
end;
$$;

revoke all on function public.vendor_analytics(uuid, uuid, integer) from public;
revoke all on function public.vendor_analytics(uuid, uuid, integer) from anon, authenticated;
grant execute on function public.vendor_analytics(uuid, uuid, integer) to service_role;
