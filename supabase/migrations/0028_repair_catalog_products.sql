-- =============================================================================
-- Abyss — 0028: Repair catalog_products after the 0027 regression
--
-- 0027 rewrote catalog_products using jsonb_agg (which returns a single jsonb
-- value, not jsonb[]) and dropped the limit clamping, the 'all' category
-- passthrough and the null-safe ilike guards. Calling it failed with:
--
--   22P02: malformed array literal: "[" must introduce explicitly-specified
--           array dimensions.
--
-- This restores the 0015 semantics exactly and adds the cover-image
-- metadata columns. Identical body to the corrected 0027.
-- =============================================================================

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
        (select pi.blur_placeholder from public.product_images pi
         where pi.product_id = p.id order by pi.position asc limit 1) as image_blurhash,
        (select pi.width from public.product_images pi
         where pi.product_id = p.id order by pi.position asc limit 1) as image_width,
        (select pi.height from public.product_images pi
         where pi.product_id = p.id order by pi.position asc limit 1) as image_height,
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
