-- =============================================================================
-- Abyss — 0016: cast product status to product_status enum
--
-- vendor_product_upsert passed p_status (text) straight into the
-- product_status column, which Postgres rejects with
-- `column "status" is of type product_status but expression is of type text`.
-- Now casts explicitly (input is validated to draft|active|archived first).
-- Re-run safe: CREATE OR REPLACE only.
-- =============================================================================

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
    values (p_vendor_id, v_name, v_slug, v_desc, v_brand, p_base_price, coalesce(p_status, 'draft')::public.product_status)
    returning id into v_id;
    -- First variant so the product is orderable + stock-tracked from day one.
    insert into public.product_variants (product_id, size, sku, stock_quantity)
    values (v_id, 'OS', v_slug || '-os-' || left(md5(random()::text), 6), 0);
  else
    update public.products
    set name = v_name, slug = v_slug, description = v_desc, brand = v_brand,
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

revoke all on function public.vendor_product_upsert(uuid, uuid, uuid, text, text, text, text, numeric, text, text) from public;
revoke all on function public.vendor_product_upsert(uuid, uuid, uuid, text, text, text, text, numeric, text, text) from anon, authenticated;
grant execute on function public.vendor_product_upsert(uuid, uuid, uuid, text, text, text, text, numeric, text, text) to service_role;

