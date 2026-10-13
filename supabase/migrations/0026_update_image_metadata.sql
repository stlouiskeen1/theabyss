-- =============================================================================
-- Abyss — 0026: Update product_images with blurhash, width, height
--
-- Adds RPC to update image metadata (LQIP blurhash, dimensions) after upload.
-- Called from /api/seller/upload after generating client-side.
-- =============================================================================

create or replace function public.vendor_product_image_update_meta(
  p_owner uuid,
  p_vendor_id uuid,
  p_product_id uuid,
  p_image_url text,
  p_blurhash text default null,
  p_width integer default null,
  p_height integer default null
)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  v_img_id uuid;
begin
  if not public.vendor_owned(p_owner, p_vendor_id) then
    raise exception 'vendor_product_image_update_meta: forbidden';
  end if;

  -- Verify product ownership
  if not exists (
    select 1 from public.products
    where id = p_product_id and vendor_id = p_vendor_id
  ) then
    raise exception 'vendor_product_image_update_meta: product not found';
  end if;

  -- Find the image by URL and product
  select id into v_img_id
  from public.product_images
  where product_id = p_product_id and url = p_image_url
  limit 1;

  if v_img_id is null then
    raise exception 'vendor_product_image_update_meta: image not found';
  end if;

  -- Update metadata
  update public.product_images
  set blur_placeholder = p_blurhash,
      width = p_width,
      height = p_height
  where id = v_img_id;

  return true;
end;
$$;

revoke all on function public.vendor_product_image_update_meta(uuid, uuid, uuid, text, text, integer, integer) from public;
revoke all on function public.vendor_product_image_update_meta(uuid, uuid, uuid, text, text, integer, integer) from anon, authenticated;
grant execute on function public.vendor_product_image_update_meta(uuid, uuid, uuid, text, text, integer, integer) to service_role;