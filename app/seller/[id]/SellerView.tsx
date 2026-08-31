"use client";

import Image from "next/image";
import { useState } from "react";
import ProductGrid from "@/components/ProductGrid";
import { ButtonLink } from "@/components/ui";
import { useLang } from "@/lib/i18n";
import {
  asset,
  formatPrice,
  placeholder,
  type Product,
  type Seller,
} from "@/lib/mock";

export default function SellerView({
  seller,
  products,
}: {
  seller: Seller;
  products: Product[];
}) {
  const { t, lang } = useLang();
  const [following, setFollowing] = useState(false);

  const range = products.length
    ? `${formatPrice(Math.min(...products.map((p) => p.price)))} — ${formatPrice(
        Math.max(...products.map((p) => p.price))
      )}`
    : "—";

  const about = lang === "fr" ? seller.aboutFr : seller.about;

  return (
    <div>
      {/* Editorial hero — mobile: stacked above the photo. Desktop: overlaid. */}
      <section className="relative overflow-hidden bg-soft-cloud">
        <div className="relative flex flex-col sm:aspect-[21/9] sm:block">
          <div className="relative z-10 flex flex-col items-start gap-3 px-5 pb-6 pt-10 sm:absolute sm:inset-0 sm:justify-center sm:px-8 sm:py-0">
            <span className="rounded-lg border border-hairline bg-canvas px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-ink">
              {t("seller.seller")} — {seller.location} / {t("seller.since")}{" "}
              {seller.founded}
            </span>
            <h1 className="font-display text-[13vw] font-normal uppercase leading-[0.85] tracking-tight text-ink sm:text-7xl lg:text-[88px]">
              {seller.name}
            </h1>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setFollowing((v) => !v)}
                className={`press focus-kill inline-flex h-11 items-center rounded-lg px-6 text-sm font-medium lowercase transition-colors ${
                  following
                    ? "bg-canvas text-ink hover:bg-soft-cloud"
                    : "bg-ink text-on-primary hover:bg-charcoal"
                }`}
              >
                {following ? t("seller.following") : t("seller.follow")}
              </button>
              <span className="text-sm text-ink/70">@{seller.handle}</span>
            </div>
          </div>
          <div className="relative aspect-[4/5] w-full sm:absolute sm:inset-0 sm:aspect-auto">
            {/* Seller hero image — slot "seller-s1" .. "seller-s5". Set it in IMAGE_MAP. */}
            <Image
              src={asset(
                `seller-${seller.id}`,
                placeholder(`seller-${seller.id}`, 1200, 1500)
              )}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-contain object-center sm:object-[75%_center]"
            />
            <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-canvas/95 via-canvas/15 to-transparent sm:block" />
          </div>
        </div>
      </section>

      {/* Stats + about */}
      <section className="mt-12 grid gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <p className="max-w-[46ch] text-lg leading-8 text-charcoal sm:text-xl">
          {about}
        </p>
        <dl className="grid h-fit grid-cols-3 gap-6 border-t border-hairline-soft pt-6">
          <div>
            <dt className="text-xs uppercase tracking-wide text-mute">
              {t("seller.objects")}
            </dt>
            <dd className="mt-1 text-2xl font-medium tabular-nums text-ink">
              {products.length}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-mute">
              {t("seller.range")}
            </dt>
            <dd className="mt-1 text-2xl font-medium tabular-nums text-ink">
              {range}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-mute">
              {t("seller.origin")}
            </dt>
            <dd className="mt-1 text-2xl font-medium text-ink">
              {seller.location}
            </dd>
          </div>
        </dl>
      </section>

      {/* Catalogue */}
      <section className="mt-12 flex flex-col gap-6 pb-4">
        <div className="flex items-center justify-between px-5 sm:px-8">
          <h2 className="text-[28px] font-medium uppercase tracking-tight text-ink">
            {t("seller.shopAll")}
          </h2>
          <ButtonLink href="/category/all" variant="secondary" className="hidden sm:inline-flex">
            {t("home.viewAll")}
          </ButtonLink>
        </div>
        <div className="px-2 sm:px-6">
          <ProductGrid items={products} initial={products.length} step={0} cols={4} />
        </div>
      </section>
    </div>
  );
}