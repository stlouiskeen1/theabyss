-- =============================================================================
-- Abyss — 0015: public catalog RPCs (real catalog checkout)
--
-- The storefront reads the live catalog through these SECURITY DEFINER RPCs
-- (tables are locked since 0009). Called server-side with the service role,
-- same pattern as the vendor RPCs — no anon/authenticated grants needed.
--
--   • catalog_products  — active products of active vendors (paged, filterable)
--   • catalog_product   — one product by slug, with variants + images
--
-- NOTE: vendor-created products carry category_id = null until category
-- assignment lands in the desk — they surface under "all" meanwhile.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. catalog_products — grid payload.
-- ---------------------------------------------------------------------------
create or replace function public.catalog_products(
  p_category text default null,
  p_search text default null,
  p_limit integer default 60,
  p_offset integer default 0
)
returns jsonb[]
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit, 60), 120));
  v_offset integer := greatest(0, coalesce(p_offset, 0));
  v_search text := nullif(btrim(coalesce(p_search, '')), '');
begin
  return (
    select coalesce(array_agg(to_jsonb(t) order by t.created_at desc), '{}')
    from (
      select
        p.id, p.name, p.slug, p.description, p.brand,
        p.base_price, p.currency, p.created_at,
        c.slug as category_slug,
        v.name as vendor_name, v.slug as vendor_slug,
        (select pi.url from public.product_images pi
         where pi.product_id = p.id order by pi.position asc limit 1) as image_url,
        (select coalesce(sum(pv.stock_quantity), 0)
         from public.product_variants pv where pv.product_id = p.id) as stock_total
      from public.products p
      join public.vendors v on v.id = p.vendor_id and v.status = 'active'
      left join public.categories c on c.id = p.category_id
      where p.status = 'active'
        and (p_category is null or p_category = 'all' or c.slug = p_category)
        and (v_search is null
          or p.name ilike '%' || v_search || '%'
          or coalesce(p.brand, '') ilike '%' || v_search || '%'
          or coalesce(p.description, '') ilike '%' || v_search || '%')
      order by p.created_at desc
      limit v_limit offset v_offset
    ) t
  );
end;
$$;

revoke all on function public.catalog_products(text, text, integer, integer) from public;
revoke all on function public.catalog_products(text, text, integer, integer) from anon, authenticated;
grant execute on function public.catalog_products(text, text, integer, integer) to service_role;

-- ---------------------------------------------------------------------------
-- 2. catalog_product — PDP payload (variants + images).
-- ---------------------------------------------------------------------------
create or replace function public.catalog_product(p_slug text)
returns jsonb
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_slug text := lower(btrim(replace(coalesce(p_slug, ''), 'live:', '')));
  v_id uuid;
begin
  if v_slug = '' then
    return null;
  end if;
  select p.id into v_id
  from public.products p
  join public.vendors v on v.id = p.vendor_id and v.status = 'active'
  where lower(p.slug) = v_slug and p.status = 'active'
  limit 1;
  if v_id is null then
    return null;
  end if;
  return jsonb_build_object(
    'product', (
      select to_jsonb(x) from (
        select p.id, p.name, p.slug, p.description, p.brand,
               p.base_price, p.currency, p.created_at,
               c.slug as category_slug,
               v.name as vendor_name, v.slug as vendor_slug
        from public.products p
        join public.vendors v on v.id = p.vendor_id
        left join public.categories c on c.id = p.category_id
        where p.id = v_id
      ) x
    ),
    'variants', (
      select coalesce(jsonb_agg(to_jsonb(pv) order by pv.created_at), '[]')
      from public.product_variants pv where pv.product_id = v_id
    ),
    'images', (
      select coalesce(jsonb_agg(to_jsonb(pi) order by pi.position), '[]')
      from public.product_images pi where pi.product_id = v_id
    )
  );
end;
$$;

revoke all on function public.catalog_product(text) from public;
revoke all on function public.catalog_product(text) from anon, authenticated;
grant execute on function public.catalog_product(text) to service_role;
