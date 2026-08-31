# ABYSS — Using Your Own Images

Every photo on the site is currently **real Nike product photography**
(`public/images/*.png`, © Nike Inc.) used as demo placeholders. This guide
explains how the system works and how to replace them with your own photography.

## How it works in 30 seconds

All images flow through one lookup: **slot name → URL**, defined in
`lib/mock.ts` as the `IMAGE_MAP` object. When a slot isn't in the map, the site
falls back to a random stock photo. So to swap any image you only ever add **one
line**.

```
"slot-name": "/images/your-file.jpg",
```

Example step-by-step:

1. Put your photo in the project's `public/images/` folder:
   ```
   public/images/ab-01.jpg
   ```
   (Anything inside `public/` is served at the matching path, so this file
   becomes `http://localhost:3000/images/ab-01.jpg`.)

2. Open `lib/mock.ts`, find `IMAGE_MAP`, uncomment/add the line:
   ```ts
   export const IMAGE_MAP: Record<string, string> = {
     "ab-01": "/images/ab-01.jpg",
   };
   ```

3. Restart `npm run dev` (or just refresh — Next serves new files).

That's it. That one line changes the photo on the product cards, the product
detail page, and the cart thumbnails at the same time.

> **Current placeholder images** are real Nike product photos downloaded from
> `static.nike.com` (CDN URLs mined from nike.com PDP pages) into
> `public/images/`. They may not depict the exact ABYSS mock product they sit
> on — swap them for your own shots before publishing. Local files in `public/`
> need **no configuration** and have **no size limit**; next/image
> auto-optimizes/resizes them for each place they appear.

---

## Slot names

### Product photos (`ab-XX`, where XX = 01–26)

| Slot          | Where it's used                                   |
| ------------- | ------------------------------------------------- |
| `ab-01`       | Cover photo: cards, product page, cart thumbnail  |
| `ab-01-2`     | 2nd angle on the product page                     |
| `ab-01-3`     | 3rd angle on the product page                     |
| `ab-01-4`     | (optional) 4th angle on the product page          |

Example:
```ts
"ab-01": "/images/ab-01.jpg",
"ab-01-2": "/images/ab-01-back.jpg",
"ab-01-3": "/images/ab-01-detail.jpg",
```

### Editorial images

| Slot                            | Where it's used                                 |
| ------------------------------- | ----------------------------------------------- |
| `hero-home`                     | Homepage campaign hero (big banner headline)    |
| `category-apparel`              | "Shop by Category" tile on the homepage         |
| `category-footwear`             | "Shop by Category" tile on the homepage         |
| `category-accessories`          | "Shop by Category" tile on the homepage         |
| `category-outerwear`            | "Shop by Category" tile on the homepage         |
| `seller-s1` .. `seller-s5`      | Each seller's page hero                         |

### Browsing ALL current slots

Run this in the repo to list every slot the code references:

```
rg -o 'asset\("[^"]+"' app components lib
```

---

## Recommended sizes

| Image              | Shape | Minimum size           |
| ------------------ | ----- | ---------------------- |
| Product photos     | 4:5   | 1200 × 1500 px         |
| Homepage hero      | wide  | 1920 × 1080 px (or larger) |
| Category tiles     | 4:5   | 800 × 1000 px          |
| Seller heroes      | wide  | 1920 × 1080 px (or larger) |

Product cards, the PDP gallery and category tiles are 4:5 now (that's the native
ratio of the Nike product shots, so the whole product fits without cropping).
Heroes show the image `object-contain` so large portrait images are never cut
off — they just sit on the light `bg-soft-cloud` band.

Use JPG or WebP. Next.js scales images down automatically (see `next.config.ts`),
so slightly larger originals are fine.

---

## Going fully self-hosted (no picsum at all)

If you want zero dependency on the placeholder service:

1. Put all your files in `public/images/` (e.g. `products/ab-01.jpg`).
2. Fill `IMAGE_MAP` with every slot you need.
3. Optionally remove `picsum.photos` from `next.config.ts` → `images.remotePatterns`.
   - Background `bg-soft-cloud` (`#f5f5f5`) shows while loading, so missing
     slots degrade gracefully — you'll see an empty grey tile.

## Using a CDN / external host (Cloudinary, S3, CMS)

The `IMAGE_MAP` value can be a full URL instead of a local path:

```ts
"ab-01": "https://res.cloudinary.com/your-cloud/image/upload/ab-01.jpg",
```

For next/image to load it you must allow that host in `next.config.ts`:

```ts
images: {
  remotePatterns: [
    // ...keep picsum.photos or remove it once you've migrated
    { protocol: "https", hostname: "res.cloudinary.com" },
  ],
},
```

## Troubleshooting

- **`Invalid src prop` / host not configured** → the host isn't in
  `images.remotePatterns`. Add it there (local `/images/...` files never need this).
- **Old image still shows** → Next caches optimized images. Hard-refresh
  (`Ctrl+Shift+R`), or restart `npm run dev`. After changing files inside
  `public/`, a restart guarantees pickup.
- **Wrong crop** → cards crop to 1:1, heroes are full-bleed. Matched the
  recommended sizes above, or adjust `object-cover`/`object-position` in the
  component that renders it (`ProductCard.tsx`, `app/HomeView.tsx`,
  `app/product/[id]/ProductDetailView.tsx`, `app/seller/[id]/SellerView.tsx`).
- **Huge files slow the site** → keep originals under ~2–3 MB each; next/image
  will still downscale, but large uploads bloat the `public/` folder.

## Where the code lives (for deeper edits)

- `lib/mock.ts` — `IMAGE_MAP` + `asset()` helper; product `imageUrls` arrays.
- `next.config.ts` — allowed remote image hosts.
- `app/HomeView.tsx` — hero + category tiles.
- `app/product/[id]/ProductDetailView.tsx` — product gallery (4 shots).
- `app/seller/[id]/SellerView.tsx` — seller hero.
- `components/ProductCard.tsx`, `components/CartDrawer.tsx` — consume the
  product cover (`imageUrls[0]`).