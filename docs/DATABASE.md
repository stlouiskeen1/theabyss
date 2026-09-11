# ABYSS — Database Guide

Everything about the live Supabase database behind the Abyss storefront: current
state, how to connect, how to change things, and how to verify.

**Project ref:** `mfwlenaqfglmrsapzcsx` ("the abyss")

---

## 1. How everything connects

```
Next.js app (browser)
   │  NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY   (.env.local)
   ▼
lib/supabase.ts ──> createBrowserClient<Database>()   (anon role)
   │
   │  reads catalog via REST (RLS: public reads active products)
   │  auth via Auth0  (Universal Login → /redirect/oidc)
   │  orders via security definer RPCs (anon/guest OK, see §6)
   ▼
Hosted Supabase project mfwlenaqfglmrsapzcsx
   ├─ Postgres  (tables, RLS, triggers, functions)     ← managed here
   ├─ Auth      (Supabase Auth)                        ← legacy; unused by the app
   └─ Storage   (product-images, vendor-assets buckets)
```

- **Keys** live in `.env.local` (git-ignored). Copy `.env.example` and fill from
  Dashboard → Project Settings → API. Without them the app silently falls back
  to the localStorage demo.
- The **anon key** is public by design (sent to browsers). It has NO bypass of
  RLS. The `service_role` key bypasses RLS — keep it server-side only, never in
  frontend code.
- This machine already has the Supabase **CLI logged in and linked** to the
  project, so `npx supabase ... --linked` commands work without login flags.

---

## 2. Applied state (migrations)

Migrations are plain SQL files in `supabase/migrations/`, applied in order.
Deployed so far:

| File | Contents | Applied |
| --- | --- | --- |
| `0001_init.sql` | 18 tables, 8 enums, RLS on everything, signup trigger, totals trigger, indexes | ✅ |
| `0002_seed_geography.sql` | Wilayas 1–69 + 15 checkout communes | ✅ |
| `0003_storage.sql` | `product-images` + `vendor-assets` buckets, public read, per-user upload | ✅ |
| `0004_seed_catalog.sql` | Catalog mirror of `lib/mock.ts`: 4 categories, 5 vendors, 26 products, 108 variants, 78 images | ✅ |
| `0005_fix_signup_and_order_rpcs.sql` | Fix `handle_new_user`, `orders.collected`, `addresses.commune_name`, `order_ref_seq`, `mailer_autoconfirm`, order RPCs (§6) | ✅ |
| `0006_fix_order_place_address.sql` | `order_place` now links `orders.shipping_address_id` (was left null); removed smoke-test data | ✅ |
| `0007_fix_status_casts.sql` | Explicit `::public.order_status` / `::public.vendor_order_status` casts (CASE literals in `order_advance`/`order_cancel` threw 42804) | ✅ |
| `0008_secure_order_rpcs.sql` | `orders.auth0_sub text` + index; `order_place` gets a 9th `p_auth0_sub` arg (defaults null) and creates a `payments` row (COD `pending`); `order_list_by_sub(p_sub)` added; all admin RPCs revoked from anon/authenticated → re-granted to `service_role` only; `order_place` stays anon-executable | ✅ |
| `0009_lock_tables.sql` | **Direct table lockdown**: RLS re-asserted on every `public` table **and** all `anon`/`authenticated` table+sequence privileges revoked. The browser can no longer SELECT/INSERT/UPDATE/DELETE `orders`, `order_items`, `payments`, `profiles`, etc. through PostgREST — everything goes through the RPC layer (checkout) or `service_role` (`/api` routes) | ✅ |

### Verify what's live

README: after `0009_lock_tables.sql` the anon key has **no** table access by
design — anon REST counts no longer work (401 is the *correct* response). Check
state in the Dashboard SQL editor or with the `service_role` key (server only),
e.g.:

```sql
-- RLS is on + anon/authenticated have zero table privileges:
select c.relname, c.relrowsecurity, c.relforcerowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relname;

-- function grants (anon may execute ONLY order_place):
select p.proname, pg_get_function_identity_arguments(p.oid) as args, array_agg(g.grantee) as grantees
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
left join pg_attrdef a on true
left join information_schema.role_routine_grants g
  on g.routine_name = p.proname and g.specific_name = p.oid::text
where n.nspname = 'public'
group by p.proname, p.oid;
```

---

## 3. Schema

### Enums

| Enum | Values |
| --- | --- |
| `user_role` | `customer` · `vendor` · `admin` |
| `vendor_status` | `pending` · `active` · `suspended` |
| `product_status` | `draft` · `active` · `archived` |
| `order_status` | `pending` · `confirmed` · `completed` · `cancelled` (parent order) |
| `vendor_order_status` | `pending` · `processing` · `shipped` · `delivered` · `cancelled` (per-vendor) |
| `payment_method` | `cod` · `edahabia` · `cib` · `satim` |
| `payment_status` | `pending` · `paid` · `failed` · `refunded` |
| `payout_status` | `pending` · `paid` |

### Tables (18)

| Table | Purpose | Notable columns |
| --- | --- | --- |
| `profiles` | One row per auth user | `full_name NOT NULL`, `role`, `phone`, `avatar_url` |
| `wilayas` | Algeria geography (ids 1–69 = official codes) | `code UNIQUE`, `name_fr`, `name_en` |
| `communes` | Only the 15 checkout communes seeded (not the full list) | `wilaya_id` FK |
| `vendors` | Sellers (mirror of mock sellers s1–s5) | `slug UNIQUE`, `status`, `commission_rate` (0.10) |
| `categories` | 4: apparel/footwear/accessories/outerwear | `slug UNIQUE`, `position` |
| `products` | Catalog rows (26, all `active`) | `vendor_id`, `category_id`, `base_price`, `currency='DZD'` |
| `product_variants` | One row per size (108) | `sku UNIQUE` = `{productId}-{SIZE}`, `price_override`, `stock_quantity` |
| `product_images` | Product photos (78) | `product_id`, `url`, `position` |
| `addresses` | Saved + per-order delivery addresses | `user_id`, `full_name`, `phone`, `wilaya_id`, `address_line` |
| `carts` | Basket (nullable `user_id` = guest) | — |
| `cart_items` | Cart lines | `cart_id`, `product_variant_id`, `quantity` |
| `orders` | Checkout-level order | `status`, `ref UNIQUE` (`DZ-0001` style), `payment_method`, `total_amount`, `shipping_fee`, `shipping_address_id` |
| `vendor_orders` | Per-vendor sub-order under an order | `vendor_id`, `status`, `subtotal`, `commission_amount` |
| `order_items` | Line items | `vendor_order_id`, `product_variant_id`, `unit_price`, `subtotal` |
| `payments` | Payment attempts | `method`, `status`, `transaction_ref` |
| `reviews` | Product reviews | `rating 1–5`, unique (product, user) |
| `wishlists` | Saved objects | unique (user, product) |
| `vendor_payouts` | Vendor finance | `amount`, `status`, `period_start/end` |

### Triggers & functions (deployed)

| Object | Behavior |
| --- | --- |
| `handle_new_user()` + trigger `on_auth_user_created` | On `auth.users` insert → creates the `profiles` row. Since 0005: `full_name` from `raw_user_meta_data->>'name'` (falls back to the email), plus `phone`/`avatar_url`; `on conflict (id) do nothing`. |
| `recalc_order_totals()` + trigger | Keeps `vendor_orders.subtotal` and parent `orders.total_amount` correct whenever `order_items` change (sums non-cancelled vendor subtotals + shipping fee). |
| `set_updated_at()` | Defined but **not attached** to any table (no table has `updated_at`). |
| `is_admin()` | `security definer` — returns whether the caller's profile has `role='admin'`. Used by many RLS policies. |
| `order_display_status(order u, vendors jsonb)` | `security definer` helper — maps vendor statuses → a single frontend status (`placed`/`confirmed`/`in-transit`/`delivered`/`cancelled`). |
| `serialize_order(order u, vendors jsonb)` | `security definer` helper — returns the full order JSON document (order + address + items + display status) the client renders. |
| `order_ref_seq` | Sequence (start 1001) driving unique `DZ-####` refs. |
| RPCs `order_place` / `order_list_own` / `order_list_all` / `order_advance` / `order_cancel` / `order_set_collected` | `security definer` order-graph writes + desk queries. Signature-per-signature in §6. |

### Row Level Security (summary)

**Since `0008` + `0009`, the model is: storefront = RPCs, server = `service_role`,
nobody else touches tables.**

RLS is enabled on every `public` table, and `anon` / `authenticated` have had
**all** table + sequence privileges revoked (0009). The `security definer` RPCs
run as owner (`postgres`, bypasses RLS), and the `/api` routes use the
`service_role` key (a `bypassrls` role) — those stay fully functional.

| Who | Table access | Function access |
| --- | --- | --- |
| `anon` (browser key) | **none** (401/404 on any PostgREST table path) | `order_place` ONLY — guests can check out, nothing else |
| `authenticated` (Supabase JWT) | **none** | `order_place` |
| `service_role` (server-only) | all (bypasses RLS) | `order_list_all`, `order_list_by_sub`, `order_advance`, `order_cancel`, `order_set_collected`, `order_list_own` |
| `postgres` | all | all |

> Orders are written through **RPCs** because the checkout creates the full
> `orders` + `vendor_orders` + `order_items` + `payments` + `addresses` graph as
> one atomic unit, with prices resolved from the DB. Since 0008 every order is
> also stamped with `orders.auth0_sub` when the buyer is signed in (Auth0 `sub`);
> `/api/account/orders` returns exactly those rows via
> `order_list_by_sub(p_sub)`.

### Storage buckets

| Bucket | Public? | Upload |
| --- | --- | --- |
| `product-images` | yes (public read) | authenticated users into `{uid}/…` |
| `vendor-assets` | yes (public read) | authenticated users into `{uid}/…` |

---

## 4. Order status machine

Frontend displays a single status per order; the DB tracks it per vendor.

| Frontend order state | DB `vendor_orders.status` | DB parent `orders.status` |
| --- | --- | --- |
| `placed` | `pending` | `pending` |
| `confirmed` | `processing` | `confirmed` |
| `in-transit` | `shipped` | `confirmed` |
| `delivered` | `delivered` (all vendors) | `completed` |
| `cancelled` | `cancelled` | `cancelled` |

Multi-vendor orders advance each vendor sub-order; the parent status is derived
from the aggregate (all delivered → `completed`, any still open → `confirmed`).

---

## 5. How to change the database

### The golden loop

1. **Add a migration** `supabase/migrations/0006_your_change.sql` (plain SQL).
   Numbering must keep ascending order — never edit an already-applied file;
   add a new one instead.
2. **Apply it** to the live project:
   ```bash
   npx supabase db push --password "<db-password>"
   ```
   (db password is in the Dashboard, not in the repo.)
3. **Regenerate the TypeScript types** so the client stays in sync:
   ```bash
   npx supabase gen types typescript --linked > types/database.types.ts
   ```
   This file is generated — hand-edits get overwritten.
4. **Verify** with the SQL editor (§2) or a `service_role` REST call — anon table access is intentionally locked.
5. **Verify the app**: `npx tsc --noEmit`, `npx eslint app components lib --max-warnings=0`, `npm run build`.

### Specific, common changes

| What you want | How |
| --- | --- |
| Change the catalog (products / sizes / prices / sellers / images) | Edit `lib/mock.ts`, then run `npx tsx scripts/generate-catalog-seed.mts` → it rewrites `0004_seed_catalog.sql` idempotently (`on conflict … do nothing`). Push it again. |
| Add a read-only table for the storefront | New table + `… select using (true)` policy + migration → push → gen types. |
| Add a mutation the browser has to do | Prefer a `security definer` RPC function + `grant execute to anon, authenticated` (same pattern as the order RPCs). Do **not** loosen RLS to make raw inserts work. |
| Change what an admin can do | Tweak the `public.is_admin()`-based policies (all already route through it). |
| Promote a user to admin (for /ops) | In the SQL editor: `update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'their@email' limit 1);` |
| Reset demo data | Delete rows (respecting FKs), then re-push the seeds — migrations are idempotent for the seeded tables. |
| Full DB reset | Not recommended against a live project. If truly needed: drop/recreate can’t be done safely via the CLI for a hosted project — use the Dashboard (Settings → Database → Reset) or a fresh project + re-push all migrations. |

---

## 6. The RPC layer (order flow)

**Deployed (0005–0008).** All are `security definer` (bypass RLS so guests + the
server routes can work). Grants are split deliberately:

| RPC | Callers | What it does |
| --- | --- | --- |
| `order_place(p_items jsonb, p_name, p_phone, p_wilaya int, p_commune, p_address, p_shipping_fee numeric, p_payment_method, p_auth0_sub text DEFAULT null)` | anon + authenticated (browser checkout) | Inserts address + order (`ref` = `DZ-0001`…) + one vendor_order per vendor + order_items + a `payments` row (COD `pending`) atomically; binds `orders.shipping_address_id`; stamps `orders.auth0_sub` when logged in. `p_items` is `[{sku, quantity}]`; prices come from the DB, not the client. Returns the serialized order. |
| `order_list_by_sub(p_sub text)` | service_role only | Returns every order stamped with the given Auth0 `sub` (drives `/api/account/orders`). |
| `order_list_all()` | service_role only | Returns every order with full contact data (drives the `/ops` desk via `/api/ops`). |
| `order_list_own()` | service_role only | Returns the caller’s orders (by `auth.uid()`) — legacy, unused by the Auth0 storefront. |
| `order_advance(p_order_id)` | service_role only | Advances open vendor orders one step (pending→processing→shipped→delivered) and reconciles the parent status. |
| `order_cancel(p_order_id)` | service_role only | Marks open vendor orders + the parent order cancelled. |
| `order_set_collected(p_order_id, p_collected bool)` | service_role only | Toggles the COD `collected` flag used by the desk. |

Two helpers back the serialized shapes: `order_display_status()` (single
frontend status derived from the vendor statuses) and `serialize_order()` (full
order + address + items + display status as one JSON document).

Also deployed with the RPC layer:

- **`orders.auth0_sub text` + `orders_auth0_sub_idx`** — 0008. The Auth0 session `sub` (from `/auth/profile`, `user.id`) is stamped at checkout, which is what lets `/api/account/orders` return "my orders" without leaking others.
- **`orders.collected boolean NOT NULL DEFAULT false`** — COD collection flag for the desk.
- **`addresses.commune_name text`** — the checkout commune text (frontend strings like `"Sidi Yahia / Saïd Hamdine"` do **not** match the seeded `communes` names, so the desk snapshots the raw string alongside `wilaya_id`; `commune_id` stays null).
- **`order_ref_seq` sequence (start 1001)** — drives unique `DZ-####` refs.
- **`payments` row on checkout** — 0008: every `order_place` also records a COD `payments` row with `status='pending'` so revenue can be reconciled later.

---

## 7. Status & next steps

The signed-off sprint **"Auth + Orders to live"** and the **Phase 1 security
sprint** are **done and verified** against the live project:

- 0005 – 0009 pushed live; RPC order layer + Auth0 identity + table lockdown working.
- 0008: all order admin RPCs are `service_role`-only; guests are limited to `order_place`; every order can be stamped with the Auth0 `sub`.
- 0009: anon no longer has any direct table access (verified: GET/DELETE on `orders`, `order_items`, `payments`, `products`, `categories`, `profiles` all → 401; `order_place` still accepted from anon).
- `lib/orders.tsx`, `app/ops/OpsView.tsx`, `app/account/AccountView.tsx` rewired to the Auth0-gated `/api/ops` + `/api/account/orders` routes; `/ops` is server-guarded (redirects to login). Passcode removed.
- `types/database.types.ts` regenerated from the live DB.

Still open (tracked separately):

1. **`SUPABASE_SERVICE_ROLE_KEY` + `AUTH0_ADMIN_EMAILS` in `.env.local`** — the routes need the real service-role key + the admin allowlist to operate (absent config fails closed: `/api/ops` → 500 "not configured", `/ops` → login gate). **Action required from the owner.**
2. Phase 2 (COD-only — remove the fake CIB/Satim/Edahabia path) and later phases — see `docs/LAUNCH.md`.

---

## 8. Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `null value in column "full_name"` when signing up | **Fixed in 0005** — `handle_new_user` now falls back to the email when no name is provided. |
| `new row violates row-level security policy` | You’re hitting RLS with a raw insert. Use the RPC path or review the policy. |
| Duplicate key on `slug` / `sku` / `ref` when re-seeding | Seeds do `on conflict … do nothing`; delete the rows first if you intend to replace. |
| Types mismatch after a DB change | Ran out of sync: re-run `npx supabase gen types typescript --linked`. |
| Anon REST returns 401 | Wrong/anonymous key or a denied bucket policy — check the anon key in `.env.local`. |
| “Cannot read property of undefined” from an RPC in React | Migration not pushed yet; the RPC name is missing from the generated types. Push + regen types. |
| CLI says project is unlinked | `npx supabase link --project-ref mfwlenaqfglmrsapzcsx --password "<db-password>"` |

---

## 9. Security notes

- `.env*` is git-ignored. The anon key is meant to be public; the **db password
  and service_role key must never be committed or shipped to the browser**.
- Since 0008 + 0009 the attack surface is: `anon` can only call `order_place`
  (a checked, `security definer` RPC) — no table reads/writes through PostgREST,
  no order listing, no desk mutations. All desk/account reads go through
  Auth0-session-gated `/api` routes backed by `service_role`.
- The `/ops` desk is **not** guarded by the client anymore: the page is a
  server component that redirects to sign-in without a session, and the routes
  enforce an `AUTH0_ADMIN_EMAILS` allowlist (absent config = nobody is admin).
- `orders.auth0_sub` ties orders to the Auth0 identity; `/api/account/orders`
  returns ONLY `order_list_by_sub(session.sub)` rows.
- `security definer` functions are the boundary for writes — keep their
  search_path pinned (`set search_path = public, pg_temp` in the body) and grant
  execute narrowly (`order_place` → anon/authenticated; admin RPCs → `service_role`).