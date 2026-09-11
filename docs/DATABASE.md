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

### Verify what's live

```powershell
# anon counts (catches a broken migration fast)
# set $anon to your NEXT_PUBLIC_SUPABASE_ANON_KEY
$tables = 'categories','vendors','products','product_variants','product_images','wilayas','communes'
foreach ($t in $tables) {
  $r = Invoke-WebRequest -Uri "https://mfwlenaqfglmrsapzcsx.supabase.co/rest/v1/$t`?select=id&limit=1" `
        -Headers @{apikey=$anon; Authorization="Bearer $anon"; Prefer="count=exact"}
  "$t : $($r.Headers.'Content-Range')"
}
```

Expected: `0-0/4 · 0-0/5 · 0-0/26 · 0-0/108 · 0-0/78 · 0-0/69 · 0-0/15`.

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

RLS is enabled on **all 18 tables**. Policy pattern, table by table:

| Table | Read | Write |
| --- | --- | --- |
| `profiles` | self or admin | self or admin |
| `vendors` | active only (or admin) | admin insert; owner/admin update; admin delete |
| `categories` | everyone | admin only |
| `products` | active (or admin) | vendor owner / admin |
| `product_variants` / `product_images` | via active product | vendor owner / admin |
| `wilayas` / `communes` | everyone | — |
| `addresses` | owner | owner |
| `carts` / `cart_items` | owner (or guest-owned) | owner |
| `orders` | own or admin | own insert / admin update only |
| `vendor_orders` | own vendor or admin | own vendor / admin |
| `order_items` | own vendor or admin | — (no insert policy) |
| `payments` | related party or admin | — |
| `reviews` | everyone | authenticated owner only |
| `wishlists` | owner | owner |
| `vendor_payouts` | own vendor or admin | admin only |

> The reason orders are written through **RPCs** (deployed in 0005–0007) rather
> than direct inserts: `order_items` has no write policy at all, and an anonymous /
> guest checkout fundamentally cannot satisfy the `orders` write policies. The
> RPCs run as `security definer` (owner = postgres) so they can write the full
> `orders` + `vendor_orders` + `order_items` graph as one atomic unit.

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
4. **Verify** with the anon REST counts (§2) or the SQL editor.
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

**Deployed (0005–0007).** All are `security definer` (bypass RLS so guests + the
desk can work) and `grant execute` to `anon` + `authenticated`:

| RPC | Role | What it does |
| --- | --- | --- |
| `order_place(p_items jsonb, p_name, p_phone, p_wilaya int, p_commune, p_address, p_shipping_fee numeric, p_payment_method)` | anyone (anon/guest ok) | Inserts the address + order (`ref` = `DZ-0001`…) + one vendor_order per vendor + order_items atomically; binds `orders.shipping_address_id` (fixed in 0006). `p_items` is `[{sku, quantity}]`; prices come from the DB, not the client. Returns the serialized order. |
| `order_list_own()` | any auth/anon caller | Returns the caller’s orders (by `auth.uid()`). |
| `order_list_all()` | **open (demo)** — see §7 | Returns every order with full contact data. **Demo decision**: the /ops desk unlocks with the client passcode `abyss`, so this RPC is intentionally open for now. Revisit before a public launch. |
| `order_advance(p_order_id)` | anyone | Advances open vendor orders one step (pending→processing→shipped→delivered) and reconciles the parent status. |
| `order_cancel(p_order_id)` | anyone | Marks open vendor orders + the parent order cancelled. |
| `order_set_collected(p_order_id, p_collected bool)` | anyone | Toggles the COD `collected` flag used by the desk. |

Two helpers back the serialized shapes: `order_display_status()` (single
frontend status derived from the vendor statuses) and `serialize_order()` (full
order + address + items + display status as one JSON document).

Also deployed with the RPC layer:

- **`orders.collected boolean NOT NULL DEFAULT false`** — COD collection flag for the desk.
- **`addresses.commune_name text`** — the checkout commune text (frontend strings like `"Sidi Yahia / Saïd Hamdine"` do **not** match the seeded `communes` names, so the desk snapshots the raw string alongside `wilaya_id`; `commune_id` stays null).
- **Fixed `handle_new_user`** — sets `full_name` from `raw_user_meta_data->>'name'`, falling back to the email, so signups stop throwing the `NOT NULL` error.
- **`order_ref_seq` sequence (start 1001)** — drives unique `DZ-####` refs.
- **Email auto-confirm** — `auth.mailer_autoconfirm = true` so `signUp` returns a session instantly (demo UX).

---

## 7. Status & next steps

The signed-off sprint **"Auth + Orders to live"** is **done and verified** end to
end against the live project (anon REST: place → advance → set_collected →
list_all; catalog counts §2 all match). The signed-off scope shipped:

- 0005 – 0007 pushed live; RPC order layer + signup fix working (smoke order `DZ-1003` left in the DB as sample data).
- `lib/orders.tsx` rewritten RPC-backed (localStorage fallback when Supabase isn’t configured); `app/checkout/CheckoutView.tsx` awaits `placeOrder`.
- `types/database.types.ts` regenerated from the live DB.

Still open (tracked separately, none blocking the demo):

1. **Auth0↔orders identity** — orders are currently guest rows (`user_id` null)
   under the anon key; Auth0 is the identity provider, so wiring
   `auth0_token`/`sub` → the order needs a future storefront-side link.
2. **Close `order_list_all`** — flip the demo-open RPC to admin-only before a
   public launch (make it `security definer` check `is_admin()` or gate the
   policy).
3. Keep the golden loop (§5) for every future DB change.

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
- `order_list_all` is intentionally **open** right now (demo desk). Anyone with
  the anon key can read every order’s name/phone/address. Close it (admin-only)
  before anything public.
- Orders are **guest rows** today: placed under the anon key, so `user_id` is
  null even though Auth0 is the identity provider. The Auth0 `sub` → order link
  is still open (§7).
- `security definer` functions are the boundary for writes — keep their
  search_path pinned and grant execute narrowly (`anon`/`authenticated` only,
  not `service_role` consumers).