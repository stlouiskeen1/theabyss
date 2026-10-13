-- =============================================================================
-- Abyss — 0024: Hard delete products when unpublished
--
-- When a vendor "unpublishes" a product, it is permanently removed from the
-- database (hard delete) instead of being archived. This keeps the database
-- lightweight and avoids stale data.
--
-- Updates vendor_product_delete to always hard delete (removes has_orders check).
-- The 'archive' action is kept for backward compatibility but frontend should use 'delete'.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Update vendor_product_delete to ALWAYS hard delete (remove has_orders check)
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
  -- Hard delete (cascades to variants, images, colors, measurements via FK)
  delete from public.products where id = p_product_id;
  return true;
end;
$$;

revoke all on function public.vendor_product_delete(uuid, uuid) from public;
revoke all on function public.vendor_product_delete(uuid, uuid) from anon, authenticated;
grant execute on function public.vendor_product_delete(uuid, uuid) to service_role;

-- ---------------------------------------------------------------------------
-- 2. Optional: Keep vendor_product_archive for backward compatibility
--    but it's now deprecated - frontend should use 'delete' action
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 3. Add comment to product_status enum noting 'archived' is deprecated
--    (Can't easily remove enum value in Postgres, so we keep it)
-- ---------------------------------------------------------------------------
comment on type public.product_status is 'draft, active, archived (deprecated - use hard delete via vendor_product_delete)';