# ABYSS — Database Guide (plain language)

Your store's data lives in **Supabase** (hosted Postgres database).
Project: `mfwlenaqfglmrsapzcsx` ("the abyss").

- Browse/edit data: Supabase Dashboard → **Table Editor**
- Run SQL: Supabase Dashboard → **SQL Editor**
- Manage logins: Dashboard → **Authentication → Users**
- Turn Google login on/off: **Authentication → Providers → Google**

You can do almost everything from the Table Editor (like a spreadsheet) without
writing SQL. The copy-paste SQL recipes below are for the rest.

---

## 1. The tables, in plain language

### People
| Table | What it is | Key columns |
| --- | --- | --- |
| `auth.users` | Login accounts (Supabase Auth, hidden schema) | `id`, `email` |
| `profiles` | One row per user, auto-created at signup | `id` (= user id), `full_name`, `phone`, `role` (`customer`/`vendor`/`admin`), `avatar_url` |

### Sellers
| Table | What it is | Key columns |
| --- | --- | --- |
| `vendors` | Boutiques | `name`, `slug` (the `/seller/xxx` address), `owner_id` (the user's id), `status` (`pending`/`active`/`suspended`), `commission_rate`, `wilaya_id` |

A vendor with `status = 'pending'` is invisible on the site. Set it to `'active'`
and it goes live. `'suspended'` hides it again.

### Catalog
| Table | What it is | Key columns |
| --- | --- | --- |
| `categories` | Apparel / Footwear / Accessories / Outerwear | `slug`, `name_en`, `name_fr` |
| `products` | Things for sale | `vendor_id`, `name`, `slug` (unique), `base_price`, `status` (`draft`/`active`/`archived`) |
| `product_variants` | Buyable size/color versions + **stock** | `product_id`, `size`, `color`, `sku` (unique), `price_override`, `stock_quantity` |
| `product_images` | Photos | `product_id`, `url`, `position` (0 = cover) |

Only `active` products show on the live storefront. A product needs at least one
variant with `stock_quantity > 0` to be orderable. `draft` = hidden work-in-progress,
`archived` = hidden but keeps its history.

### Orders (buyer checks out → split per vendor)
| Table | What it is | Key columns |
| --- | --- | --- |
| `orders` | The buyer's whole checkout (`DZ-1001`…) | `ref`, `status` (`pending`/`confirmed`/`completed`/`cancelled`), `total_amount`, `shipping_fee`, `payment_method` (always `cod`), `collected`, `user_id`, `auth0_sub` (the buyer's login id), `shipping_address_id` |
| `vendor_orders` | Each vendor's slice of an order | `order_id`, `vendor_id`, `status` (`pending`/`processing`/`shipped`/`delivered`/`cancelled`), `subtotal`, `commission_amount`, `tracking_number` |
| `order_items` | Lines inside a vendor slice | `vendor_order_id`, `product_variant_id`, `quantity`, `unit_price`, `subtotal` |
| `addresses` | Saved delivery addresses | `user_id`, `full_name`, `phone`, `wilaya_id`, `commune_name`, `address_line` |

Order flow: `pending` → `confirmed` → `completed`, or `cancelled` any time.
Cancelling returns the stock automatically. There is **no returns flow** — a
cancelled order is the closest thing.

### Money
| Table | What it is | Key columns |
| --- | --- | --- |
| `payments` | One row per order, COD `pending` until cash collected | `order_id`, `method`, `status` (`pending`/`paid`/`failed`/`refunded`), `amount` |
| `vendor_payouts` | What you owe each vendor (you create these) | `vendor_id`, `amount`, `status` (`pending`/`paid`), `period_start`, `period_end`, `paid_at` |

### Engagement & misc
| Table | What it is |
| --- | --- |
| `reviews` | Product ratings 1–5 (one per user per product) |
| `wishlists` | Saved products per user |
| `carts` / `cart_items` | Baskets (currently the app uses browser storage instead) |
| `wilayas` / `communes` | Algeria geography (wilaya `id` = its code, 1–69) |

---

## 2. How data moves (the big picture)

```
Signup → auth.users row → trigger creates profiles row
Apply (/seller/apply) → vendors row (pending)
You approve → vendors.status = 'active' → storefront /seller/slug goes live
Seller adds product (draft) → sets stock → flips to active → buyable
Buyer checkout (COD) → orders row + vendor_orders slice(s) + order_items +
                        payments row (pending) + stock decreases
Desk (/ops) advance/cancel → statuses move; cancel restores stock
You pay vendor → you insert a vendor_payouts row → mark paid
```

---

## 3. Copy-paste recipes (SQL Editor)

**See my users**
```sql
select u.email, p.full_name, p.role, p.created_at
from auth.users u left join public.profiles p on p.id = u.id
order by p.created_at desc limit 50;
```

**Make someone admin (app-level: also needs their email in `ADMIN_EMAILS`)**
```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'YOU@EXAMPLE.COM');
```

**Approve a vendor / suspend / re-activate**
```sql
update public.vendors set status = 'active' where slug = 'SHOP-SLUG';
-- update public.vendors set status = 'suspended' where slug = 'SHOP-SLUG';
```

**Publish a product / set stock**
```sql
update public.products set status = 'active' where slug = 'PRODUCT-SLUG';
update public.product_variants set stock_quantity = 25 where sku = 'THE-SKU';
```

**Find an order and its slices**
```sql
select * from public.orders where ref = 'DZ-1001';
select vo.*, v.name as vendor
from public.vendor_orders vo join public.vendors v on v.id = vo.vendor_id
where vo.order_id = (select id from public.orders where ref = 'DZ-1001');
```

**Record a vendor payout**
```sql
insert into public.vendor_payouts (vendor_id, amount, status, period_start, period_end)
values ((select id from public.vendors where slug = 'SHOP-SLUG'), 15000, 'pending', '2026-09-01', '2026-09-30');
-- when actually paid:
update public.vendor_payouts set status = 'paid', paid_at = now() where id = 'PAYOUT-ID';
```

**What a vendor sold (last 30 days)**
```sql
select p.name, sum(oi.quantity) as units, sum(oi.subtotal) as revenue
from public.order_items oi
join public.product_variants v on v.id = oi.product_variant_id
join public.products p on p.id = v.product_id
join public.vendor_orders vo on vo.id = oi.vendor_order_id
where p.vendor_id = (select id from public.vendors where slug = 'SHOP-SLUG')
  and vo.status <> 'cancelled'
group by p.name order by units desc;
```

**Check which migrations/RPCs are live**
```sql
select proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and proname like 'vendor_%' order by 1;
-- expect: vendor_analytics, vendor_apply, vendor_list_own, vendor_orders_list,
-- vendor_owned, vendor_payouts_list, vendor_product_archive, vendor_product_delete,
-- vendor_product_upsert, vendor_products_list, vendor_public_get,
-- vendor_stock_set, vendor_variant_delete, vendor_variant_upsert
```

---

## 4. Rules that keep you out of trouble

1. **Never delete rows from `orders`, `order_items`, `payments`, `profiles`.**
   Cancel orders, archive products — history must stay intact.
2. **To hide something, change its `status`** (`active` → `archived`/`suspended`/`draft`), don't delete it. Hard-delete is only safe for products/variants that never sold (the desk enforces this).
3. **Slugs and SKUs must stay unique.** If an insert complains about duplicates, pick another slug/SKU.
4. **The app never talks to tables directly** (locked since migration 0009). It uses RPC functions (`vendor_*`, `order_*`). If the site says "function X does not exist", that migration wasn't applied — apply the numbered SQL files **in order** in the SQL editor.
5. **Keys:** `NEXT_PUBLIC_*` keys are public by design. `SUPABASE_SERVICE_ROLE_KEY` bypasses everything — server only, never in code, never on GitHub, never in chat.
6. **Admin access to `/ops`** = your email must be in `ADMIN_EMAILS` in `.env.local` **and** you must restart `npm run dev` after changing it.

## 5. Files that match this doc

- `supabase/migrations/0001–0014*.sql` — schema + RPCs, applied in numeric order
- `lib/vendors.server.ts`, `lib/orders.server.ts` — server-side DB access
- `app/api/seller/*`, `app/api/account/orders`, `app/api/ops` — API routes
- `docs/DATABASE.md` — older developer-oriented notes (partially outdated: it still mentions Auth0; this guide is the current one)
