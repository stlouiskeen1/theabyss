"use client";

import Link from "next/link";
import { useWishlist } from "@/lib/wishlist";
import { useLang } from "@/lib/i18n";
import { formatPrice, getProduct } from "@/lib/mock";
import { ButtonLink } from "@/components/ui";

export default function WishlistView() {
  const { ids, toggle, clear } = useWishlist();
  const { t } = useLang();

  const items = ids
    .map((id) => getProduct(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <>
      {/* Archive index header */}
      <section className="w-full border-b border-border-rule bg-surface-paper px-margin-mobile py-unit-xl sm:px-margin-desktop">
        <div className="flex flex-col gap-unit-md">
          <div className="flex items-center justify-between font-mono-technical text-mono-technical text-text-muted">
            <div className="flex items-center gap-unit-xs uppercase">
              <Link href="/" className="transition-colors hover:text-primary">
                {t("plp.breadcrumbBase")}
              </Link>
              <span>/</span>
              <span className="font-bold text-primary">{t("wishlist.title")}</span>
              <span>/</span>
              <span className="text-status-cod">
                {t("wishlist.count", { n: items.length })}
              </span>
            </div>
            <div className="hidden items-center gap-unit-md sm:flex">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent-crimson" />
              <span className="font-label-caps-sm text-label-caps-sm uppercase tracking-widest">
                {t("wishlist.sync")}
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-unit-lg pt-unit-xs lg:flex-row lg:items-end">
            <div>
              <div className="flex items-baseline gap-unit-sm">
                <h1 className="font-headline-lg text-headline-lg uppercase tracking-tight text-primary">
                  {t("wishlist.title")}
                </h1>
                <span className="font-mono-technical text-label-caps font-bold text-accent-crimson">
                  [{items.length}]
                </span>
              </div>
              <p className="mt-1 font-body-editorial text-body-editorial text-text-muted">
                {t("wishlist.sub")}
              </p>
            </div>
            {items.length > 0 && (
              <button
                type="button"
                onClick={clear}
                className="press focus-kill self-start font-label-caps-sm text-label-caps-sm uppercase text-accent-crimson transition-colors hover:underline lg:self-end"
              >
                {t("wishlist.clear")}
              </button>
            )}
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto w-full px-margin-mobile md:px-margin-desktop py-unit-xl">
        {items.length === 0 ? (
          <div className="flex flex-col items-start gap-unit-lg bg-surface-paper p-unit-lg shadow-sm">
            <div className="flex items-center gap-unit-sm">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              <span className="font-label-caps-sm text-label-caps-sm text-text-muted uppercase tracking-widest">
                {t("wishlist.void")}
              </span>
            </div>
            <div>
              <h2 className="font-headline-lg text-headline-sm uppercase tracking-tight text-primary">
                {t("wishlist.emptyTitle")}
              </h2>
              <p className="mt-unit-2xs max-w-[44ch] font-body-utility text-text-muted leading-relaxed">
                {t("wishlist.emptyDesc")}
              </p>
            </div>
            <ButtonLink href="/category/all" variant="primary">
              {t("cart.viewCatalogue")}
            </ButtonLink>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-unit-md sm:grid-cols-2 lg:grid-cols-3">
            {items.map((product) => {
              const onSale = typeof product.originalPrice === "number";
              return (
                <li
                  key={product.id}
                  className="flex flex-col bg-surface-paper shadow-sm"
                >
                  <Link
                    href={`/product/${product.id}`}
                    className="relative block aspect-square overflow-hidden bg-surface-container"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.imageUrls[0]}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </Link>
                  <div className="flex flex-col gap-unit-sm p-unit-md">
                    <div className="flex items-start justify-between gap-unit-sm">
                      <Link
                        href={`/product/${product.id}`}
                        className="min-w-0 transition-colors hover:text-accent-crimson"
                      >
                        <p className="truncate font-headline-sm text-headline-sm uppercase tracking-tight text-primary">
                          {product.name}
                        </p>
                        <p className="mt-0.5 truncate font-mono-technical text-mono-technical uppercase text-text-muted">
                          {product.sellerName}
                        </p>
                      </Link>
                    </div>
                    <div className="flex items-baseline gap-unit-sm">
                      <span className="font-mono-technical text-mono-technical font-bold text-primary">
                        {formatPrice(product.price)}
                      </span>
                      {onSale ? (
                        <s className="font-mono-technical text-mono-technical text-text-muted">
                          {formatPrice(product.originalPrice!)}
                        </s>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between gap-unit-sm border-t border-border-rule pt-unit-sm">
                      <Link
                        href={`/product/${product.id}`}
                        className="press focus-kill font-label-caps-sm text-label-caps-sm uppercase text-primary transition-colors hover:text-accent-crimson"
                      >
                        {t("wishlist.view")}
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggle(product.id)}
                        className="press focus-kill font-label-caps-sm text-label-caps-sm uppercase text-text-muted transition-colors hover:text-accent-crimson"
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
      </main>
    </>
  );
}