"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLang, promoLabelKey } from "@/lib/i18n";
import { formatPrice, type Product } from "@/lib/mock";
import { useWishlist } from "@/lib/wishlist";
import { SwatchDot, WishlistButton } from "@/components/ui";

export default function ProductCard({ product }: { product: Product }) {
  const { t } = useLang();
  const { has, toggle } = useWishlist();
  const [colorway, setColorway] = useState(0);
  const onSale = typeof product.originalPrice === "number";
  const pct = onSale
    ? Math.round(
        ((product.originalPrice! - product.price) / product.originalPrice!) *
          100
      )
    : 0;

  // Swatch dots sit next to the cover. Clicking one swaps the visible
  // colorway in place (imageUrls[i] is the shot for swatch i) instead of
  // opening the product page.

  return (
    <div className="group block">
      <Link href={`/product/${product.id}`} className="focus-kill block">
        {/* Cover photo = imageUrls[colorway] (slot ab-XX). Swap it via IMAGE_MAP in lib/mock.ts. */}
        {/* 4:5 frame matches the Nike source ratio, so the whole product fits. */}
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-soft-cloud">
          <Image
            src={product.imageUrls[colorway]}
            alt={product.name}
            fill
            sizes="(min-width:1024px) 25vw, (min-width:768px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
          {product.promo ? (
            <span className="absolute left-2 top-2 rounded-lg border border-hairline bg-canvas px-3 py-1 text-xs font-medium text-ink">
              {t(promoLabelKey(product.promo))}
            </span>
          ) : null}
          <WishlistButton
            active={has(product.id)}
            label={t("wishlist.toggle")}
            onClick={() => toggle(product.id)}
            className="absolute right-2 top-2"
          />
        </div>
      </Link>

      <div className="mt-2.5 flex items-center gap-2" aria-label={t("pdp.colorway")}>
        {product.swatches.map((c, i) => (
          <SwatchDot
            key={c}
            color={c}
            active={colorway === i}
            label={t("pdp.swatch", { n: i + 1 })}
            onClick={() => setColorway(i)}
          />
        ))}
      </div>

      <Link href={`/product/${product.id}`} className="focus-kill block">
        <h3 className="mt-2 truncate text-base font-medium leading-snug text-ink">
          {product.name}
        </h3>
        <p className="mt-0.5 truncate text-sm leading-snug text-mute">
          {product.sellerName}
        </p>

        <div className="mt-1 flex items-baseline gap-2">
          {onSale ? (
            <>
              <span className="text-base font-medium text-sale">
                {formatPrice(product.price)}
              </span>
              <s className="text-sm font-medium text-mute">
                {formatPrice(product.originalPrice!)}
              </s>
              <span className="text-sm font-medium text-sale">
                {t("common.off", { n: pct })}
              </span>
            </>
          ) : (
            <span className="text-base font-medium text-ink">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}