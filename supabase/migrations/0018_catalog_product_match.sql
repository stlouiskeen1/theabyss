-- =============================================================================
-- Abyss — 0018: tolerant single-product lookup
--
-- catalog_product used an exact case-sensitive slug match, so it returned
-- null for slugs the list RPC (ILIKE search) happily found. It now matches
-- case-insensitively and tolerates a stray `live:` prefix.
-- Re-run safe: CREATE OR REPLACE only.
-- =============================================================================

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
