-- =============================================================================
-- Abyss — 0027: Expose cover-image LQIP + dimensions in the public catalog
--
-- catalog_product (PDP) already returns the whole product_images row via
-- to_jsonb(), so it carries blur_placeholder / width / height. But
-- catalog_products (listing) only returned a bare `image_url`, so product
-- cards had no LQIP to show and no intrinsic size to reserve layout with.
--
-- This adds `image_blurhash`, `image_width`, `image_height` for the cover
-- image of every listed product. Everything else about catalog_products is
-- byte-for-byte the 0015 behaviour (array_agg, limit clamping, 'all'
-- category passthrough, null-safe ilike).
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
