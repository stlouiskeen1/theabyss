# ABYSS — Launch Blueprint

COD-only launch. Everything here is the ordered path from "working demo" to
"store that takes real COD orders". Tick items as they land.

**Decision (locked):** Payment is **cash on delivery only**. The fake
CIB / Satim / Edahabia path is removed, not wired.

---

## Phase 0 — Housekeeping

- [x] Commit the full working tree
- [x] GitHub remote (`origin` → `stlouiskeen1/theabyss`) in sync
- [x] Add CI — `.github/workflows/ci.yml` (lint + `tsc --noEmit` + build)
- [x] First green CI run on `master`

## Phase 1 — Close the security holes (SHIP-BLOCKER)

The storefront previously could read **every order's PII** via the public anon key
and any visitor could cancel/advance/delete orders. Fixed:

- [x] Migration `0008`: `revoke execute` on `order_list_all`, `order_advance`,
      `order_cancel`, `order_set_collected`, `order_list_own`,
      `order_list_by_sub` from `anon`, `authenticated`, `public`;
      `grant execute` to `service_role` only. Push + `gen types`.
- [x] Migration `0009`: **direct table lockdown** — RLS re-asserted on every
      `public` table + all `anon`/`authenticated` table/sequence privileges
      revoked. (Found live: anon could `DELETE /rest/v1/orders` and read
      `order_items`/`payments`/`profiles`; verified → 401 after 0009.)
- [x] Storefront stops calling `order_list_all` on every page load
      (`lib/orders.tsx` provider effect + `refresh` removed).
- [x] `/api/ops` (GET list / POST advance·cancel·collect) — Auth0-session-gated,
      `service_role` Supabase client, admin check (env allowlist
      `AUTH0_ADMIN_EMAILS`).
- [x] `/api/account/orders` — Auth0-session-gated, returns only the caller's
      orders (match by Auth0 `sub`, stored at checkout).
- [x] `/ops` page guarded server-side (redirects to `/account/login` without a
      session). Passcode `"abyss"` deleted.
- [x] Account history no longer matches orders by customer name.
- [x] `order_place` stores the Auth0 `sub` (when logged in) for ownership.
- [ ] **Owner action**: add `SUPABASE_SERVICE_ROLE_KEY` + `AUTH0_ADMIN_EMAILS`
      to `.env.local` (fails closed until then).

## Phase 2 — COD-only checkout

- [ ] Remove CIB / Satim / Edahabia radio + all copy from `CheckoutView`
      (EN + FR keys too).
- [ ] `order_place` rejects any `p_payment_method` other than `'cod'`.
- [ ] COD confirmation copy is honest ("cash on delivery", no gateway wording).
- [ ] Cleanup migration for payment rows with fake methods (optional).

## Phase 3 — Order integrity

- [ ] Shipping fee computed **server-side** (`orders.shipping_fee`), drop
      trusting `p_shipping_fee` from the client.
- [ ] Totals derived server-side end-to-end.
- [ ] `SELECT … FOR UPDATE` around the stock availability check in
      `order_place` (removes the TOCTOU race).
- [ ] Stock restored when an order is cancelled.
- [ ] Basic `order_place` spam guard (verified phone hint, honeypot field,
      server-side rate limit on `/api`).

## Phase 4 — Catalog live

The storefront still reads `lib/mock.ts`; the seeded DB is never queried. Fix:

- [ ] Read catalog from Supabase (server components, public RLS reads).
- [ ] Product images from Storage buckets; update `next.config.ts`
      `remotePatterns` for `supabase.co` storage domain.
- [ ] Real `stock_quantity` surfaced in PDP + cards (sold-out disables sizes).
- [ ] Search over live data (server-side `ILIKE` at this scale).
- [ ] Mock removed or reduced to a dev-only fallback.

## Phase 5 — Reliability & observability

- [ ] `error.tsx` + `global-error.tsx` (localized), `loading.tsx` states.
- [ ] `aria-live` announcements for cart/order mutations.
- [ ] `prefers-reduced-motion` variants; drop `transition: all` instances.
- [ ] Security headers (CSP, HSTS, frame/referrer/permissions) via
      `next.config.ts` `headers()`.
- [ ] Environment validation at boot (graceful for Supabase, fatal-with-message
      for Auth0).
- [ ] `robots.txt`, `sitemap.xml`, OG image + metadata.
- [ ] Error monitoring (Sentry or Vercel Analytics).

## Phase 6 — UX floor

- [ ] Arabic (ar) locale + RTL layout; latin fonts extended or RTL font added.
- [ ] Legibility floor: body ≥ 14px on mobile, touch targets ≥ 44px.
- [ ] Purge UX lies: wilaya count (58 vs 69) contradiction, fake stock
      badges, any "certified gateway" copy.

## Phase 7 — Ship

- [ ] Push to Vercel (or `next start` on chosen host).
- [ ] Real domain; `APP_BASE_URL` set to `https://…` (Secure cookies).
- [ ] Vercel env vars (Auth0 + Supabase), no secrets in repo.
- [ ] E2E sign-off: guest COD order → `/ops` sees it → advance → collected.
- [ ] Admin account configured (`AUTH0_ADMIN_EMAILS`).
- [ ] Go/no-go checklist (security gates from Phase 1 green).

---

## Post-launch (not blockers)

- Order confirmation email.
- TVA / invoice generation.
- Per-wilaya shipping rates.
- Product reviews.
- Business formalities: NIF / registre de commerce / privacy docs for DZ.