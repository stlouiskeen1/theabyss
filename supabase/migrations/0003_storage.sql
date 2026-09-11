-- =============================================================================
-- Abyss — Storage buckets
-- product-images: product gallery photos (public read, vendor write)
-- vendor-assets:  vendor logos / banners (public read, vendor write)
-- =============================================================================

insert into storage.buckets (id, name, public)
values
  ('product-images', 'product-images', true),
  ('vendor-assets', 'vendor-assets', true)
on conflict (id) do nothing;

-- Public read on both buckets (they are public buckets; policies are
-- required for Supabase to allow anonymous SELECT).
create policy "product_images_public_read"
  on storage.objects for select
  using (bucket_id = 'product-images');
create policy "vendor_assets_public_read"
  on storage.objects for select
  using (bucket_id = 'vendor-assets');

-- Authenticated users upload into a folder keyed by their profile (uid).
-- The app path hints `{uid}/...`; vendors write their own assets.
create policy "product_images_authenticated_upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "vendor_assets_authenticated_upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'vendor-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owners can replace/delete their own uploads.
create policy "product_images_owner_write"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "product_images_owner_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "vendor_assets_owner_write"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'vendor-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "vendor_assets_owner_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'vendor-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );