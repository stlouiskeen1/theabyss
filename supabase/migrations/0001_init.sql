-- =============================================================================
-- Abyss — Initial schema
-- Multi-vendor luxury / streetwear marketplace for Algeria.
-- Supabase (Postgres + Auth). UUID PKs except geography (integer, seeded).
--
-- Run order: 0001_init.sql → 0002_seed_geography.sql → 0003_storage.sql
-- Then: supabase gen types typescript > types/database.types.ts
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type user_role as enum ('customer', 'vendor', 'admin');
create type vendor_status as enum ('pending', 'active', 'suspended');
create type product_status as enum ('draft', 'active', 'archived');

-- Parent checkout/basket-level order lifecycle.
create type order_status as enum ('pending', 'confirmed', 'completed', 'cancelled');

-- Per-vendor sub-order lifecycle. `pending` = placed (awaiting phone
-- confirmation), `processing` = confirmed by phone, `shipped` = in transit.
-- Frontend maps its ops-desk machine onto these values.
create type vendor_order_status as enum (
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled'
);

create type payment_method as enum ('cod', 'edahabia', 'cib', 'satim');
create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');
create type payout_status as enum ('pending', 'paid');

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  phone text,
  role user_role not null default 'customer',
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Geography (Algeria) — static, seeded once
-- ---------------------------------------------------------------------------
create table public.wilayas (
  id integer primary key,
  code integer not null unique,
  name_fr text not null,
  name_en text not null
);

create table public.communes (
  id integer primary key,
  wilaya_id integer references public.wilayas (id) on delete cascade,
  name_fr text not null,
  name_en text not null
);

-- ---------------------------------------------------------------------------
-- Vendors
-- ---------------------------------------------------------------------------
create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles (id) on delete set null,
  name text not null,
  slug text unique not null,
  description text,
  logo_url text,
  banner_url text,
  wilaya_id integer references public.wilayas (id),
  commune_id integer references public.communes (id),
  status vendor_status not null default 'pending',
  commission_rate numeric(4, 3) not null default 0.10,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name_fr text not null,
  name_en text not null,
  slug text unique not null,
  parent_id uuid references public.categories (id) on delete set null,
  image_url text,
  position integer not null default 0
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references public.vendors (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  slug text unique not null,
  description text,
  brand text,
  base_price numeric(12, 2) not null check (base_price >= 0),
  currency text not null default 'DZD',
  status product_status not null default 'draft',
  created_at timestamptz not null default now()
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products (id) on delete cascade,
  size text,
  color text,
  sku text unique,
  price_override numeric(12, 2) check (price_override is null or price_override >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  created_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete set null,
  url text not null,
  position integer not null default 0
);

-- ---------------------------------------------------------------------------
-- Addresses
-- ---------------------------------------------------------------------------
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  full_name text not null,
  phone text not null,
  wilaya_id integer references public.wilayas (id),
  commune_id integer references public.communes (id),
  address_line text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Cart
-- ---------------------------------------------------------------------------
create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade, -- nullable = guest
  created_at timestamptz not null default now()
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid references public.carts (id) on delete cascade,
  product_variant_id uuid references public.product_variants (id) on delete cascade,
  vendor_id uuid references public.vendors (id),
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Orders (split by vendor — multi-vendor checkout)
-- ---------------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null, -- nullable = guest
  status order_status not null default 'pending',
  ref text unique, -- friendly ref, e.g. DZ-0001 (set at checkout in app code)
  payment_method payment_method not null default 'cod',
  total_amount numeric(12, 2) not null default 0 check (total_amount >= 0),
  shipping_fee numeric(12, 2) not null default 0 check (shipping_fee >= 0),
  shipping_address_id uuid references public.addresses (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.vendor_orders (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders (id) on delete cascade,
  vendor_id uuid references public.vendors (id) on delete cascade,
  status vendor_order_status not null default 'pending',
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  commission_amount numeric(12, 2) not null default 0 check (commission_amount >= 0),
  tracking_number text,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  vendor_order_id uuid references public.vendor_orders (id) on delete cascade,
  product_variant_id uuid references public.product_variants (id) on delete cascade,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  subtotal numeric(12, 2) not null check (subtotal >= 0)
);

-- ---------------------------------------------------------------------------
-- Payments
-- ---------------------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders (id) on delete cascade,
  method payment_method not null default 'cod',
  status payment_status not null default 'pending',
  transaction_ref text,
  amount numeric(12, 2) not null check (amount >= 0),
  paid_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Engagement
-- ---------------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);

create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  product_id uuid references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

-- ---------------------------------------------------------------------------
-- Vendor finance
-- ---------------------------------------------------------------------------
create table public.vendor_payouts (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references public.vendors (id) on delete cascade,
  amount numeric(12, 2) not null check (amount >= 0),
  status payout_status not null default 'pending',
  period_start date,
  period_end date,
  paid_at timestamptz
);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- 1. Auto-create a profile on auth signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Recalculate vendor_orders.subtotal and its parent orders.total_amount
--    whenever order_items change. The parent total is the sum of non-cancelled
--    vendor-order subtotals plus the checkout shipping fee; drivers that don't
--    affect amounts (e.g. advancing status) are ignored.
create or replace function public.recalc_order_totals()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_vo public.vendor_orders%rowtype;
  v_order_id uuid;
  v_new_total numeric(12, 2);
  v_new_subtotal numeric(12, 2);
begin
  if tg_op = 'DELETE' then
    select vo.* into v_vo from public.vendor_orders vo where vo.id = old.vendor_order_id;
    v_order_id := v_vo.order_id;
  else
    select vo.* into v_vo from public.vendor_orders vo where vo.id = new.vendor_order_id;
    v_order_id := v_vo.order_id;
  end if;

  select coalesce(sum(unit_price * quantity), 0)
    into v_new_subtotal
    from public.order_items
   where vendor_order_id = v_vo.id;

  update public.vendor_orders
     set subtotal = v_new_subtotal
   where id = v_vo.id;

  select coalesce(sum(subtotal), 0)
    into v_new_total
    from public.vendor_orders
   where order_id = v_order_id
     and status <> 'cancelled';

  update public.orders
     set total_amount = v_new_total + coalesce(
       (select shipping_fee from public.orders where id = v_order_id), 0
     )
   where id = v_order_id;

  return coalesce(new, old);
end;
$$;

create trigger recalc_order_totals
  after insert or update or delete on public.order_items
  for each row execute function public.recalc_order_totals();

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_vendors_owner on public.vendors (owner_id);
create index if not exists idx_products_vendor on public.products (vendor_id);
create index if not exists idx_products_category on public.products (category_id);
create index if not exists idx_products_slug on public.products (slug);
create index if not exists idx_variants_product on public.product_variants (product_id);
create index if not exists idx_cart_items_cart on public.cart_items (cart_id);
create index if not exists idx_cart_items_variant on public.cart_items (product_variant_id);
create index if not exists idx_order_items_vo on public.order_items (vendor_order_id);
create index if not exists idx_vendor_orders_order on public.vendor_orders (order_id);
create index if not exists idx_vendor_orders_vendor on public.vendor_orders (vendor_id);
create index if not exists idx_orders_user on public.orders (user_id);
create index if not exists idx_communes_wilaya on public.communes (wilaya_id);
create index if not exists idx_reviews_product on public.reviews (product_id);
create index if not exists idx_wishlists_user on public.wishlists (user_id);

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.profiles enable row level security;
alter table public.vendors enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.wilayas enable row level security;
alter table public.communes enable row level security;
alter table public.addresses enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.vendor_orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
alter table public.wishlists enable row level security;
alter table public.vendor_payouts enable row level security;

-- Shared helper: is the caller an admin (from their profile row)?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- profiles: read / update own row. Admins manage all.
-- ---------------------------------------------------------------------------
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id or public.is_admin());

-- ---------------------------------------------------------------------------
-- vendors: public reads active; owner updates own; admin full access.
-- ---------------------------------------------------------------------------
create policy "vendors_select_public" on public.vendors
  for select using (status = 'active' or public.is_admin());
create policy "vendors_insert_admin" on public.vendors
  for insert with check (public.is_admin());
create policy "vendors_update_owner" on public.vendors
  for update using (auth.uid() = owner_id or public.is_admin());
create policy "vendors_delete_admin" on public.vendors
  for delete using (public.is_admin());

-- ---------------------------------------------------------------------------
-- catalog: public reads active products; vendor owner CRUD; admin full.
-- ---------------------------------------------------------------------------
create policy "categories_select_public" on public.categories
  for select using (true);
create policy "categories_write_admin" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

create policy "products_select_public" on public.products
  for select using (status = 'active' or public.is_admin());
create policy "products_insert_owner" on public.products
  for insert with check (
    public.is_admin() or exists (
      select 1 from public.vendors
      where id = vendor_id and owner_id = auth.uid()
    )
  );
create policy "products_update_owner" on public.products
  for update using (
    public.is_admin() or exists (
      select 1 from public.vendors
      where id = vendor_id and owner_id = auth.uid()
    )
  );
create policy "products_delete_owner" on public.products
  for delete using (
    public.is_admin() or exists (
      select 1 from public.vendors
      where id = vendor_id and owner_id = auth.uid()
    )
  );

-- A vendor may only reach variants/images through their own products.
create policy "variants_select_public" on public.product_variants
  for select using (
    public.is_admin() or exists (
      select 1 from public.products p
      where p.id = product_id and p.status = 'active'
    )
  );
create policy "variants_insert_owner" on public.product_variants
  for insert with check (
    public.is_admin() or exists (
      select 1 from public.products p
      join public.vendors v on v.id = p.vendor_id
      where p.id = product_id and v.owner_id = auth.uid()
    )
  );
create policy "variants_update_owner" on public.product_variants
  for update using (
    public.is_admin() or exists (
      select 1 from public.products p
      join public.vendors v on v.id = p.vendor_id
      where p.id = product_id and v.owner_id = auth.uid()
    )
  );
create policy "variants_delete_owner" on public.product_variants
  for delete using (
    public.is_admin() or exists (
      select 1 from public.products p
      join public.vendors v on v.id = p.vendor_id
      where p.id = product_id and v.owner_id = auth.uid()
    )
  );

create policy "images_select_public" on public.product_images
  for select using (true);
create policy "images_write_owner" on public.product_images
  for all using (
    public.is_admin() or exists (
      select 1 from public.products p
      join public.vendors v on v.id = p.vendor_id
      where p.id = product_id and v.owner_id = auth.uid()
    )
  ) with check (
    public.is_admin() or exists (
      select 1 from public.products p
      join public.vendors v on v.id = p.vendor_id
      where p.id = product_id and v.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- geography: read-only reference data.
-- ---------------------------------------------------------------------------
create policy "wilayas_select_public" on public.wilayas for select using (true);
create policy "communes_select_public" on public.communes for select using (true);

-- ---------------------------------------------------------------------------
-- addresses / carts / cart_items / wishlists: owner only.
-- ---------------------------------------------------------------------------
create policy "addresses_select_own" on public.addresses
  for select using (auth.uid() = user_id);
create policy "addresses_insert_own" on public.addresses
  for insert with check (auth.uid() = user_id);
create policy "addresses_update_own" on public.addresses
  for update using (auth.uid() = user_id);
create policy "addresses_delete_own" on public.addresses
  for delete using (auth.uid() = user_id);

create policy "carts_select_own" on public.carts
  for select using (auth.uid() = user_id or user_id is null);
create policy "carts_insert_own" on public.carts
  for insert with check (auth.uid() = user_id or user_id is null);
create policy "carts_update_own" on public.carts
  for update using (auth.uid() = user_id or user_id is null);
create policy "carts_delete_own" on public.carts
  for delete using (auth.uid() = user_id or user_id is null);

create policy "cart_items_select_own" on public.cart_items
  for select using (
    exists (
      select 1 from public.carts c
      where c.id = cart_id and (auth.uid() = c.user_id or c.user_id is null)
    )
  );
create policy "cart_items_insert_own" on public.cart_items
  for insert with check (
    exists (
      select 1 from public.carts c
      where c.id = cart_id and (auth.uid() = c.user_id or c.user_id is null)
    )
  );
create policy "cart_items_update_own" on public.cart_items
  for update using (
    exists (
      select 1 from public.carts c
      where c.id = cart_id and (auth.uid() = c.user_id or c.user_id is null)
    )
  );
create policy "cart_items_delete_own" on public.cart_items
  for delete using (
    exists (
      select 1 from public.carts c
      where c.id = cart_id and (auth.uid() = c.user_id or c.user_id is null)
    )
  );

create policy "wishlists_select_own" on public.wishlists
  for select using (auth.uid() = user_id);
create policy "wishlists_insert_own" on public.wishlists
  for insert with check (auth.uid() = user_id);
create policy "wishlists_delete_own" on public.wishlists
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- orders: user reads own; admin full.
-- ---------------------------------------------------------------------------
create policy "orders_select_own" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());
create policy "orders_insert_own" on public.orders
  for insert with check (auth.uid() = user_id and not public.is_admin() or public.is_admin());
create policy "orders_update_admin" on public.orders
  for update using (public.is_admin());

-- ---------------------------------------------------------------------------
-- vendor_orders / order_items: vendor works own sub-orders; admin full.
-- ---------------------------------------------------------------------------
create policy "vendor_orders_select_vendor" on public.vendor_orders
  for select using (
    public.is_admin() or exists (
      select 1 from public.vendors v
      where v.id = vendor_id and v.owner_id = auth.uid()
    )
  );
create policy "vendor_orders_update_vendor" on public.vendor_orders
  for update using (
    public.is_admin() or exists (
      select 1 from public.vendors v
      where v.id = vendor_id and v.owner_id = auth.uid()
    )
  );

create policy "order_items_select_vendor" on public.order_items
  for select using (
    public.is_admin() or exists (
      select 1 from public.vendor_orders vo
      join public.vendors v on v.id = vo.vendor_id
      where vo.id = vendor_order_id and v.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- payments: related parties read their own; admin full.
-- ---------------------------------------------------------------------------
create policy "payments_select_own" on public.payments
  for select using (
    public.is_admin() or exists (
      select 1 from public.orders o
      where o.id = order_id and auth.uid() = o.user_id
    )
  );

-- ---------------------------------------------------------------------------
-- reviews: public read, authenticated insert own.
-- ---------------------------------------------------------------------------
create policy "reviews_select_public" on public.reviews
  for select using (true);
create policy "reviews_insert_own" on public.reviews
  for insert with check (auth.uid() = user_id);
create policy "reviews_update_own" on public.reviews
  for update using (auth.uid() = user_id);
create policy "reviews_delete_own" on public.reviews
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- vendor_payouts: vendor reads own; only admin writes.
-- ---------------------------------------------------------------------------
create policy "payouts_select_vendor" on public.vendor_payouts
  for select using (
    public.is_admin() or exists (
      select 1 from public.vendors v
      where v.id = vendor_id and v.owner_id = auth.uid()
    )
  );
create policy "payouts_write_admin" on public.vendor_payouts
  for all using (public.is_admin()) with check (public.is_admin());