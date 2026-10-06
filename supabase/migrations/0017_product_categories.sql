-- =============================================================================
-- Abyss — 0017: product categories in the seller desk
--
--   • catalog_categories — id/slug/names + live product counts for selects
--   • vendor_product_upsert gains p_category_id (validated, set on
--     insert/update) so desk products can live under real category pages
--     instead of "all" only.
-- Re-run safe: CREATE OR REPLACE only.
-- =============================================================================

create or replace function public.catalog_categories()
returns jsonb[]
language sql
stable
security definer set search_path = public
as $$
  select coalesce(array_agg(to_jsonb(t) order by t.position, t.slug), '{}')
  from (
    select c.id, c.slug, c.name_en, c.name_fr, c.position,
      (select count(*) from public.products p
       join public.vendors v on v.id = p.vendor_id and v.status = 'active'
       where p.category_id = c.id and p.status = 'active') as product_count
    from public.categories c
    order by c.position, c.slug
  ) t;
$$;

revoke all on function public.catalog_categories() from public;
revoke all on function public.catalog_categories() from anon, authenticated;
grant execute on function public.catalog_categories() to service_role;

-- vendor_product_upsert + category. The new 11-arg signature would overload
-- (not replace) the old 10-arg version, so drop the old one first.
drop function if exists public.vendor_product_upsert(uuid, uuid, uuid, text, text, text, text, numeric, text, text);

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
  p_category_id uuid default null
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
  if p_category_id is not null and not exists (
    select 1 from public.categories where id = p_category_id
  ) then
    raise exception 'vendor_product_upsert: bad category';
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
    -- First variant so the product is orderable + stock-tracked from day one.
    insert into public.product_variants (product_id, size, sku, stock_quantity)
    values (v_id, 'OS', v_slug || '-os-' || left(md5(random()::text), 6), 0);
  else
    update public.products
    set category_id = p_category_id,
        name = v_name, slug = v_slug, description = v_desc, brand = v_brand,
        base_price = p_base_price,
        status = coalesce(p_status::public.product_status, status)
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

revoke all on function public.vendor_product_upsert(uuid, uuid, uuid, text, text, text, text, numeric, text, text, uuid) from public;
revoke all on function public.vendor_product_upsert(uuid, uuid, uuid, text, text, text, text, numeric, text, text, uuid) from anon, authenticated;
grant execute on function public.vendor_product_upsert(uuid, uuid, uuid, text, text, text, text, numeric, text, text, uuid) to service_role;

-- vendor_products_list + category_id so the desk can show/select it.
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
        p.base_price, p.currency, p.status, p.category_id, p.created_at,
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
