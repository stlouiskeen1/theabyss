-- 0009_lock_tables.sql
--
-- Lock direct table access behind RLS + revoke anon/authenticated grants.
--
-- The storefront talks to the *public* schema exclusively through RPCs
-- (order_place for checkout, /api routes via service_role for everything
-- else). Before this migration the project's default template grants left
-- `anon` with full CRUD over orders/order_items/payments/profiles etc., which
-- bypassed every RPC relied on for authorization (e.g. anon could DELETE an
-- order straight through PostgREST).
--
-- SECURITY DEFINER RPCs are owned by `postgres` and bypass RLS, so they keep
-- working for anon callers after this lockdown (order_place grant remains).

-- Belt & suspenders: make sure every current + future table in public is RLS
-- protected (RLS only bites when the role has table privileges, revoked below).
do $$
declare
  t text;
begin
  for t in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Drop every direct table/sequence privilege for the browser-facing roles.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- Explicit re-lock of the known PII-bearing tables (paranoia; the blanket
-- revoke above already covers them).
revoke select, insert, update, delete on table public.orders from anon, authenticated;
revoke select, insert, update, delete on table public.order_items from anon, authenticated;
revoke select, insert, update, delete on table public.payments from anon, authenticated;
revoke select, insert, update, delete on table public.vendor_orders from anon, authenticated;
revoke select, insert, update, delete on table public.profiles from anon, authenticated;
revoke select, insert, update, delete on table public.addresses from anon, authenticated;
revoke select, insert, update, delete on table public.reviews from anon, authenticated;
revoke select, insert, update, delete on table public.wishlists from anon, authenticated;
revoke select, insert, update, delete on table public.vendor_payouts from anon, authenticated;
revoke select, insert, update, delete on table public.carts from anon, authenticated;
revoke select, insert, update, delete on table public.cart_items from anon, authenticated;
revoke select, insert, update, delete on table public.products from anon, authenticated;
revoke select, insert, update, delete on table public.product_variants from anon, authenticated;
revoke select, insert, update, delete on table public.product_images from anon, authenticated;
revoke select, insert, update, delete on table public.categories from anon, authenticated;
revoke select, insert, update, delete on table public.vendors from anon, authenticated;
revoke select, insert, update, delete on table public.wilayas from anon, authenticated;
revoke select, insert, update, delete on table public.communes from anon, authenticated;