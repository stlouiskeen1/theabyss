"use client";

import Link from "next/link";
import { useWishlist } from "@/lib/wishlist";
import { useLang } from "@/lib/i18n";
import { formatPrice, getProduct } from "@/lib/mock";
import { ButtonLink, Chevron } from "@/components/ui";

export default function WishlistView() {
  const { ids, toggle, clear } = useWishlist();
  const { t } = useLang();

  const items = ids
    .map((id) => getProduct(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <div className="px-5 pb-20 pt-8 sm:px-8">
      <div className="flex items-center gap-2 text-xs text-mute">
        <Link href="/" className="transition-colors hover:text-ink">
          {t("category.all")}
        </Link>
        <Chevron />
        <span className="text-ink">{t("wishlist.title")}</span>
      </div>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-normal uppercase leading-[0.95] tracking-tight text-ink sm:text-5xl">
            {t("wishlist.title")}
          </h1>
          <p className="mt-3 text-sm text-charcoal">
            {t("wishlist.count", { n: items.length })}
          </p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="press w-fit text-sm font-medium uppercase text-mute underline underline-offset-4 transition-colors hover:text-sale"
          >
            {t("wishlist.clear")}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-10 flex flex-col items-start gap-6 rounded-[18px] border border-hairline-soft bg-canvas p-8">
          <div>
            <h2 className="font-display text-xl font-normal uppercase tracking-tight text-ink sm:text-2xl">
              {t("wishlist.emptyTitle")}
            </h2>
            <p className="mt-2 max-w-[40ch] text-sm leading-6 text-charcoal">
              {t("wishlist.emptyDesc")}
            </p>
          </div>
          <ButtonLink href="/category/all" variant="primary">
            {t("cart.viewCatalogue")}
          </ButtonLink>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {items.map((product) => {
            const onSale = typeof product.originalPrice === "number";
            return (
              <li
                key={product.id}
                className="flex gap-4 rounded-[18px] border border-hairline-soft bg-canvas p-4 sm:gap-6 sm:p-5"
              >
                <Link
                  href={`/product/${product.id}`}
                  className="block flex-shrink-0"
                >
                  <span className="block h-28 w-24 overflow-hidden rounded-lg bg-soft-cloud sm:h-36 sm:w-28">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.imageUrls[0]}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </span>
                </Link>
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <Link
                        href={`/product/${product.id}`}
                        className="block truncate text-sm font-medium uppercase tracking-tight text-ink transition-colors hover:text-charcoal sm:text-base"
                      >
                        {product.name}
                      </Link>
                      <p className="mt-1 truncate text-xs text-mute">
                        {product.sellerName}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 items-baseline gap-2">
                      {onSale ? (
                        <>
                          <span className="text-sm font-medium text-sale sm:text-base">
                            {formatPrice(product.price)}
                          </span>
                          <s className="text-xs font-medium text-mute">
                            {formatPrice(product.originalPrice!)}
                          </s>
                        </>
                      ) : (
                        <span className="text-sm font-medium text-ink sm:text-base">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <ButtonLink href={`/product/${product.id}`} variant="secondary" className="h-10 px-5">
                      {t("wishlist.view")}
                    </ButtonLink>
                    <button
                      type="button"
                      onClick={() => toggle(product.id)}
                      className="press text-xs font-medium uppercase text-mute underline underline-offset-4 transition-colors hover:text-sale"
                    >
                      {t("wishlist.remove")}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
