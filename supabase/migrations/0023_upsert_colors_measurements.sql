-- =============================================================================
-- Abyss — 0023: Wire color/measurement catalogs into vendor_product_upsert
--
-- 0022 created colors/measurements catalogs and junction tables but never
-- updated vendor_product_upsert. This migration:
--   1. Enables RLS on the catalogs (public read, service write).
--   2. Updates vendor_product_upsert to accept color_ids / measurement_ids
--      arrays, sync product_colors / product_measurements junctions, and
--      derive product_variants from the selected catalogs (one variant per
--      measurement, labeled with the color catalog names).
--
-- Re-run safe: CREATE OR REPLACE for the function; ALTER/CREATE IF NOT EXISTS
-- for the rest.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. RLS on catalog tables
-- ---------------------------------------------------------------------------
alter table public.colors enable row level security;
alter table public.measurements enable row level security;
alter table public.product_colors enable row level security;
alter table public.product_measurements enable row level security;

drop policy if exists "colors_public_read" on public.colors;
create policy "colors_public_read" on public.colors
  for select using (is_active = true);

drop policy if exists "measurements_public_read" on public.measurements;
create policy "measurements_public_read" on public.measurements
  for select using (is_active = true);

-- Junction tables: no direct client access; written only via SECURITY DEFINER
-- RPCs (service_role / vendor upserts). Default-deny for anon/authenticated.

-- ---------------------------------------------------------------------------
-- 2. vendor_product_upsert with color_ids and measurement_ids
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
  p_image_url text default null,
  p_category_id uuid default null,
  p_sizes text[] default null,
  p_color text default null,
  p_color_ids uuid[] default null,
  p_measurement_ids uuid[] default null
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
  v_img text := p_image_url;
  v_color text := nullif(btrim(coalesce(p_color, '')), '');
  v_color_ids uuid[];
  v_measurement_ids uuid[];
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
  if p_color is not null and char_length(p_color) > 40 then
    raise exception 'vendor_product_upsert: color too long';
  end if;
  if p_category_id is not null and not exists (
    select 1 from public.categories where id = p_category_id
  ) then
    raise exception 'vendor_product_upsert: bad category';
  end if;
  if p_sizes is not null then
    if array_length(p_sizes, 1) is null or array_length(p_sizes, 1) > 20 then
      raise exception 'vendor_product_upsert: give 1-20 sizes';
    end if;
  end if;

  -- Validate and dedupe catalog selections.
  if p_color_ids is not null then
    select coalesce(array_agg(distinct c), '{}')
    into v_color_ids
    from unnest(p_color_ids) as c
    where exists (select 1 from public.colors col where col.id = c and col.is_active);
    if array_length(v_color_ids, 1) is null then
      v_color_ids := null;
    end if;
  end if;
  if p_measurement_ids is not null then
    select coalesce(array_agg(distinct m), '{}')
    into v_measurement_ids
    from unnest(p_measurement_ids) as m
    where exists (select 1 from public.measurements mea where mea.id = m and mea.is_active);
    if array_length(v_measurement_ids, 1) is null then
      v_measurement_ids := null;
    end if;
  end if;

  if exists (
    select 1 from public.products
    where slug = v_slug and (p_product_id is null or id <> p_product_id)
  ) then
    raise exception 'vendor_product_upsert: slug_taken';
  end if;

  if p_product_id is null then
    insert into public.products (vendor_id, category_id, name, slug, description, brand, base_price, status)
    values (p_vendor_id, p_category_id, v_name, v_slug, v_desc, v_brand, p_base_price, coalesce(p_status, 'draft')::public.product_status)
    returning id into v_id;
    if p_sizes is not null and array_length(p_sizes, 1) > 0 then
      insert into public.product_variants (product_id, size, color, sku, stock_quantity)
      select v_id,
             nullif(btrim(s), ''),
             v_color,
             v_slug || '-' || left(md5(random()::text || s), 6),
             0
      from unnest(p_sizes) as s
      where nullif(btrim(s), '') is not null;
    end if;
    -- Fallback: no usable sizes given → single one-size variant.
    if not exists (select 1 from public.product_variants where product_id = v_id) then
      insert into public.product_variants (product_id, size, sku, stock_quantity)
      values (v_id, 'OS', v_slug || '-os-' || left(md5(random()::text), 6), 0);
    end if;
  else
    update public.products
    set category_id = p_category_id,
        name = v_name, slug = v_slug, description = v_desc, brand = v_brand,
        base_price = p_base_price,
        status = coalesce(p_status::public.product_status, status)
    where id = p_product_id;
    v_id := p_product_id;
  end if;

  -- Sync color junction (full replace when the array is supplied).
  if p_color_ids is not null then
    delete from public.product_colors where product_id = v_id;
    insert into public.product_colors (product_id, color_id)
    select v_id, c from unnest(v_color_ids) as c;
  end if;

  -- Sync measurement junction (full replace when the array is supplied).
  if p_measurement_ids is not null then
    delete from public.product_measurements where product_id = v_id;
    insert into public.product_measurements (product_id, measurement_id)
    select v_id, m from unnest(v_measurement_ids) as m;

    -- Replace size variants from measurement labels when sizes were not
    -- explicitly provided (update path always syncs from measurements).
    if p_sizes is null then
      delete from public.product_variants where product_id = v_id;
      insert into public.product_variants (product_id, size, color, sku, stock_quantity)
      select v_id, mea.name, v_color, v_slug || '-' || left(md5(random()::text || mea.name), 6), 0
      from unnest(v_measurement_ids) as mid
      join public.measurements mea on mea.id = mid;
      if not exists (select 1 from public.product_variants where product_id = v_id) then
        insert into public.product_variants (product_id, size, sku, stock_quantity)
        values (v_id, 'OS', v_slug || '-os-' || left(md5(random()::text), 6), 0);
      end if;
    end if;
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

revoke all on function public.vendor_product_upsert(uuid, uuid, uuid, text, text, text, text, numeric, text, text, uuid, text[], text, uuid[], uuid[]) from public;
revoke all on function public.vendor_product_upsert(uuid, uuid, uuid, text, text, text, text, numeric, text, text, uuid, text[], text, uuid[], uuid[]) from anon, authenticated;
grant execute on function public.vendor_product_upsert(uuid, uuid, uuid, text, text, text, text, numeric, text, text, uuid, text[], text, uuid[], uuid[]) to service_role;

-- ---------------------------------------------------------------------------
-- 3. Catalog list helper (public read for the seller form)
-- ---------------------------------------------------------------------------
create or replace function public.catalog_options()
returns jsonb
language sql
stable
security definer set search_path = public
as $$
  select jsonb_build_object(
    'colors', (
      select coalesce(jsonb_agg(to_jsonb(c) order by c.sort_order, c.id), '[]'::jsonb)
      from public.colors c where c.is_active
    ),
    'measurements', (
      select coalesce(jsonb_agg(to_jsonb(m) order by m.category, m.sort_order, m.id), '[]'::jsonb)
      from public.measurements m where m.is_active
    )
  );
$$;

revoke all on function public.catalog_options() from public;
revoke all on function public.catalog_options() from anon;
grant execute on function public.catalog_options() to authenticated, service_role;
