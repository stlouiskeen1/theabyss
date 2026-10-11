-- =============================================================================
-- Abyss — 0020: Image performance pipeline
--
-- Adds image metadata columns to product_images for optimal loading:
--   width, height: intrinsic dimensions for layout stability
--   blur_placeholder: base64 LQIP (low-quality image placeholder) for blur-up
--   indexed columns for filtering/sorting performance
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Add image metadata columns to product_images
-- ---------------------------------------------------------------------------
alter table public.product_images
  add column if not exists width integer,
  add column if not exists height integer,
  add column if not exists blur_placeholder text;

-- ---------------------------------------------------------------------------
-- 2. Add indexes for filtering/sorting performance
-- ---------------------------------------------------------------------------

-- Products: composite index for category + created_at (main listing query)
create index if not exists idx_products_category_created
  on public.products (category_id, created_at desc)
  where status = 'active';

-- Products: vendor + status for seller dashboards
create index if not exists idx_products_vendor_status
  on public.products (vendor_id, status);

-- Products: price for filtering
create index if not exists idx_products_price
  on public.products (base_price)
  where status = 'active';

-- Product variants: product + size for stock lookups
create index if not exists idx_variants_product_size
  on public.product_variants (product_id, size);

-- Product images: product + position for gallery ordering
create index if not exists idx_images_product_position
  on public.product_images (product_id, position);

-- Vendor orders: vendor + status for seller dashboards
create index if not exists idx_vendor_orders_vendor_status
  on public.vendor_orders (vendor_id, status);

-- Orders: user + created_at for account history
create index if not exists idx_orders_user_created
  on public.orders (user_id, created_at desc);

-- Reviews: product + rating for analytics
create index if not exists idx_reviews_product_rating
  on public.reviews (product_id, rating);

-- Wishlists: user + product for deduping
create index if not exists idx_wishlists_user_product
  on public.wishlists (user_id, product_id);

-- ---------------------------------------------------------------------------
-- 3. Storage bucket: ensure proper cache headers via Supabase config
--    (handled in Supabase dashboard: Storage > product-images > Settings > Cache Control)
--    Recommended: public, max-age=31536000, immutable
-- =============================================================================

-- Note: Cache headers for storage objects are configured in Supabase dashboard,
-- not via SQL. See verification checklist for manual steps.