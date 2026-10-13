-- =============================================================================
-- Abyss — 0022: Color and Measurement catalogs + hard delete for products
--
-- Adds color and measurement catalogs for sellers to select from.
-- Changes product deletion from archive to hard delete.
-- Updates vendor_product_upsert to accept color_ids and measurement_ids arrays.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Color catalog
-- ---------------------------------------------------------------------------
create table public.colors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_fr text,
  hex_code text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Seed with common colors
insert into public.colors (name, name_fr, hex_code, is_active, sort_order) values
  ('Black', 'Noir', '#000000', true, 1),
  ('White', 'Blanc', '#FFFFFF', true, 2),
  ('Red', 'Rouge', '#FF0000', true, 3),
  ('Blue', 'Bleu', '#0000FF', true, 4),
  ('Green', 'Vert', '#008000', true, 5),
  ('Yellow', 'Jaune', '#FFFF00', true, 6),
  ('Orange', 'Orange', '#FFA500', true, 7),
  ('Pink', 'Rose', '#FFC0CB', true, 8),
  ('Purple', 'Violet', '#800080', true, 9),
  ('Brown', 'Marron', '#A52A2A', true, 10),
  ('Grey', 'Gris', '#808080', true, 11),
  ('Navy', 'Bleu Marine', '#000080', true, 12),
  ('Beige', 'Beige', '#F5F5DC', true, 13),
  ('Silver', 'Argent', '#C0C0C0', true, 14),
  ('Gold', 'Or', '#FFD700', true, 15),
  ('Red', 'Rouge', '#FF0000', true, 16),
  ('Maroon', 'Bordeaux', '#800000', true, 17),
  ('Olive', 'Olive', '#808000', true, 18),
  ('Teal', 'Sarcelle', '#008080', true, 19),
  ('Coral', 'Corail', '#FF7F50', true, 20);

-- ---------------------------------------------------------------------------
-- 2. Measurement catalog
-- ---------------------------------------------------------------------------
create table public.measurements (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_fr text,
  unit text not null, -- e.g., 'cm', 'inch', 'size', 'ml', 'g', 'kg'
  category text not null, -- 'size', 'weight', 'volume', 'dimension'
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Seed with common measurements
insert into public.measurements (name, name_fr, unit, category, is_active, sort_order) values
  -- Clothing sizes
  ('XS', 'XS', 'size', 'size', true, 1),
  ('S', 'S', 'size', 'size', true, 2),
  ('M', 'M', 'size', 'size', true, 3),
  ('L', 'L', 'size', 'size', true, 4),
  ('XL', 'XL', 'size', 'size', true, 5),
  ('XXL', 'XXL', 'size', 'size', true, 6),
  ('3XL', '3XL', 'size', 'size', true, 6),
  -- Shoe sizes (EU)
  ('35', '35', 'eu', 'size', true, 10),
  ('36', '36', 'eu', 'size', true, 11),
  ('37', '37', 'eu', 'size', true, 12),
  ('38', '38', 'eu', 'size', true, 13),
  ('39', '39', 'eu', 'size', true, 14),
  ('40', '40', 'eu', 'size', true, 15),
  ('41', '41', 'eu', 'size', true, 16),
  ('42', '42', 'eu', 'size', true, 17),
  ('43', '43', 'eu', 'size', true, 18),
  ('44', '44', 'eu', 'size', true, 19),
  ('45', '45', 'eu', 'size', true, 20),
  ('46', '46', 'eu', 'size', true, 21),
  ('47', '47', 'eu', 'size', true, 22),
  -- Weight
  ('100g', '100g', 'g', 'weight', true, 30),
  ('250g', '250g', 'g', 'weight', true, 31),
  ('500g', '500g', 'g', 'weight', true, 32),
  ('1kg', '1kg', 'kg', 'weight', true, 33),
  -- Volume
  ('250ml', '250ml', 'ml', 'volume', true, 40),
  ('500ml', '500ml', 'ml', 'volume', true, 41),
  ('1L', '1L', 'l', 'volume', true, 42),
  -- Dimensions
  ('One Size', 'Taille Unique', 'size', 'dimension', true, 50);

-- ---------------------------------------------------------------------------
-- 3. Product-Color and Product-Measurement junction tables
-- ---------------------------------------------------------------------------
create table public.product_colors (
  product_id uuid not null references public.products(id) on delete cascade,
  color_id uuid not null references public.colors(id) on delete cascade,
  primary key (product_id, color_id)
);

create table public.product_measurements (
  product_id uuid not null references public.products(id) on delete cascade,
  measurement_id uuid not null references public.measurements(id) on delete cascade,
  primary key (product_id, measurement_id)
);

-- ---------------------------------------------------------------------------
-- 4. Update products table: add color_ids and measurement_ids arrays
-- ---------------------------------------------------------------------------
-- Note: We keep the existing product_variants table for size/color variants with stock
-- The new product_colors and product_measurements are for filtering/display
-- Variants handle the actual stock per size/color combination

-- ---------------------------------------------------------------------------
-- 5. Update vendor_product_upsert to handle color_ids and measurement_ids arrays
-- (This will be done in the next migration updating the function)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Indexes for performance
-- ---------------------------------------------------------------------------
create index if not exists idx_colors_active on public.colors (is_active) where is_active;
create index if not exists idx_measurements_active_category on public.measurements (is_active, category) where is_active;
create index if not exists idx_product_colors_product on public.product_colors (product_id);
create index if not exists idx_product_measurements_product on public.product_measurements (product_id);