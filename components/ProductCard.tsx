"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLang, promoLabelKey, subcategoryLabelKey } from "@/lib/i18n";
import { formatPrice, getSeller, type Product } from "@/lib/mock";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { SwatchDot, WishlistButton } from "@/components/ui";

export default function ProductCard({ product }: { product: Product }) {
  const { t } = useLang();
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const [colorway, setColorway] = useState(0);
  const seller = getSeller(product.sellerId);
  const onSale = typeof product.originalPrice === "number";
  const pct = onSale
    ? Math.round(
        ((product.originalPrice! - product.price) / product.originalPrice!) *
          100
      )
    : 0;

  return (
    <article className="group relative flex flex-col justify-between border border-border-rule bg-surface-paper transition-all duration-150 hover:border-primary">
      {/* Media */}
      <div className="relative aspect-[3/4] w-full overflow-hidden border-b border-border-rule bg-surface-canvas">
        <Link
          href={`/product/${product.id}`}
          aria-label={product.name}
          className="focus-kill absolute inset-0 block"
        >
          {/* Cover photo = imageUrls[colorway] (slot ab-XX). Swap via IMAGE_MAP in lib/mock.ts. */}
          <Image
            src={product.imageUrls[colorway]}
            alt={product.name}
            fill
            sizes="(min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw"
            className="object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
          />
          {product.promo || onSale ? (
            <span
              className={`absolute left-0 top-0 px-unit-xs py-0.5 font-label-caps-sm text-label-caps-sm uppercase ${
                product.promo
                  ? "bg-accent-crimson text-on-error"
                  : "bg-surface-charcoal text-surface-canvas"
              }`}
            >
              {product.promo
                ? t(promoLabelKey(product.promo))
                : `−${pct}%`}
            </span>
          ) : null}
        </Link>

        <WishlistButton
          active={has(product.id)}
          label={t("wishlist.toggle")}
          onClick={() => toggle(product.id)}
          className="absolute right-unit-xs top-unit-xs border-border-rule bg-surface-paper"
        />

        {/* Quick size select on hover */}
        <div className="absolute inset-x-0 bottom-0 hidden items-center justify-between border-t border-border-dark bg-surface-paper/95 p-unit-xs transition-transform duration-200 group-hover:translate-y-0 translate-y-full sm:flex">
          <span className="font-label-caps-sm text-label-caps-sm uppercase text-text-muted">
            {t("card.quickSelect")}
          </span>
          <div className="flex gap-1">
            {product.sizes.slice(0, 6).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => add(product.id, s, 1)}
                className="press focus-kill h-6 w-6 border border-border-rule font-mono-technical text-label-caps-sm text-primary transition-colors hover:border-primary"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col justify-between gap-unit-md p-unit-md">
        <div className="flex flex-col gap-unit-xs">
          <div className="flex items-center justify-between border-b border-border-rule pb-unit-xs gap-unit-xs">
            <span className="truncate font-label-caps-sm text-label-caps-sm uppercase tracking-widest text-text-muted">
              {seller?.location ?? product.sellerName}
            </span>
            <span className="shrink-0 font-mono-technical text-mono-technical font-bold text-status-cod">
              {seller ? seller.id.toUpperCase() : "ABYSS"}
            </span>
          </div>

          {product.swatches.length > 1 ? (
            <div
              className="flex items-center gap-1.5"
              aria-label={t("pdp.colorway")}
            >
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
          ) : null}

          <Link href={`/product/${product.id}`} className="focus-kill block">
            <h3 className="pt-1 font-headline-sm text-headline-sm uppercase leading-snug tracking-tight text-primary">
              {product.name}
            </h3>
          </Link>

          <p className="truncate font-mono-technical text-label-caps uppercase text-text-muted">
            {t(subcategoryLabelKey(product.subcategory))}
            {product.promo ? ` · ${t(promoLabelKey(product.promo))}` : ""}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-border-rule pt-unit-xs">
          <div className="flex flex-col">
            <span className="font-label-caps-sm text-label-caps-sm uppercase text-text-muted">
              {t("card.fixedRate")}
            </span>
            <span className="font-mono-technical text-headline-sm font-bold text-primary">
              {formatPrice(product.price)}
              {onSale && product.originalPrice ? (
                <s className="ml-1.5 text-label-caps font-normal text-text-muted">
                  {formatPrice(product.originalPrice)}
                </s>
              ) : null}
            </span>
          </div>
          <button
            type="button"
            onClick={() => add(product.id, product.sizes[0], 1)}
            className="press focus-kill h-10 bg-primary px-unit-md font-label-caps text-label-caps uppercase text-on-primary transition-all hover:border hover:border-primary hover:bg-surface-paper hover:text-primary"
          >
            {t("card.add")}
          </button>
        </div>
      </div>
    </article>
  );
}