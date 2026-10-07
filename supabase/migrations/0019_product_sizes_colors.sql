-- =============================================================================
-- Abyss — 0019: sizes + color at product creation
--
-- vendor_product_upsert gains p_sizes (text[]) and p_color (text). When sizes
-- are given, one variant is created per size (with the color) instead of the
-- single "OS" (one-size) fallback variant. "OS" now only means "the seller
-- gave no sizes" — it is not forced on anyone.
-- Re-run safe: old signature dropped first (else it would overload, not
-- replace), then CREATE OR REPLACE.
-- =============================================================================

drop function if exists public.vendor_product_upsert(uuid, uuid, uuid, text, text, text, text, numeric, text, text, uuid);

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
  p_color text default null
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
  v_color text := nullif(btrim(coalesce(p_color, '')), '');
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
  if v_color is not null and char_length(v_color) > 40 then
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

revoke all on function public.vendor_product_upsert(uuid, uuid, uuid, text, text, text, text, numeric, text, text, uuid, text[], text) from public;
revoke all on function public.vendor_product_upsert(uuid, uuid, uuid, text, text, text, text, numeric, text, text, uuid, text[], text) from anon, authenticated;
grant execute on function public.vendor_product_upsert(uuid, uuid, uuid, text, text, text, text, numeric, text, text, uuid, text[], text) to service_role;
