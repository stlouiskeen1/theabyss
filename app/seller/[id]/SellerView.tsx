"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import ProductGrid from "@/components/ProductGrid";
import { ArrowIcon } from "@/components/ui";
import { useLang } from "@/lib/i18n";
import { asset, formatPrice, placeholder } from "@/lib/mock";
import type { Product, Seller } from "@/lib/mock";

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
      {/* Editorial boutique header */}
      <section className="relative w-full overflow-hidden bg-surface-charcoal text-surface-canvas">
        {/* Seller hero image — slot "seller-s1" .. "seller-s5". Set it in IMAGE_MAP. */}
        <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
          <Image
            src={asset(
              `seller-${seller.id}`,
              placeholder(`seller-${seller.id}`, 1200, 1500)
            )}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-border-dark/90 via-border-dark/40 to-border-dark/10" />
          <div className="absolute inset-0 flex flex-col justify-end p-unit-lg sm:p-unit-xl">
            <div className="flex items-center gap-unit-xs">
              <span className="font-label-caps-sm text-label-caps-sm uppercase tracking-widest text-accent-crimson">
                {t("seller.seller")} · {seller.location} /{" "}
                {t("seller.since")} {seller.founded}
              </span>
            </div>
            <h1 className="font-display-hero text-display-hero-mobile uppercase leading-none tracking-tighter text-surface-paper sm:text-display-hero">
              {seller.name}
            </h1>
            <div className="mt-unit-md flex flex-wrap items-center gap-unit-md">
              <button
                type="button"
                onClick={() => setFollowing((v) => !v)}
                className={`press focus-kill inline-flex h-11 items-center bg-surface-paper px-unit-md font-label-caps text-label-caps uppercase tracking-wider transition-colors ${
                  following
                    ? "text-primary hover:bg-surface-canvas"
                    : "text-primary hover:bg-surface-canvas"
                }`}
              >
                {following ? t("seller.following") : t("seller.follow")}
              </button>
              <span className="font-mono-technical text-mono-technical text-surface-container-highest">
                @{seller.handle}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats row */}
      <section className="w-full bg-surface-paper">
        <div className="w-full px-margin-mobile py-unit-xl sm:px-margin-desktop">
          <div className="grid grid-cols-1 items-start gap-unit-xl md:grid-cols-12">
            <p className="max-w-[52ch] font-body-editorial text-body-editorial text-text-muted md:col-span-7">
              {about}
            </p>
            <dl className="grid h-fit grid-cols-3 gap-unit-md border-t border-border-rule pt-unit-md md:col-span-5">
              <Stat label={t("seller.objects")} value={String(products.length)} />
              <Stat label={t("seller.range")} value={range} />
              <Stat label={t("seller.origin")} value={seller.location} />
            </dl>
          </div>
        </div>
      </section>

      {/* Catalogue */}
      <section className="w-full bg-surface-canvas py-unit-2xl">
        <div className="w-full px-margin-mobile sm:px-margin-desktop">
          <div className="flex flex-col justify-between gap-unit-sm pb-unit-lg sm:flex-row sm:items-end">
            <div>
              <span className="font-label-caps text-label-caps uppercase tracking-widest text-accent-crimson">
                {t("seller.objects")}
              </span>
              <h2 className="font-headline-lg text-headline-lg uppercase tracking-tighter text-primary">
                {t("seller.shopAll")}
              </h2>
            </div>
            <Link
              href="/category/all"
              className="press focus-kill inline-flex h-12 items-center justify-center gap-unit-sm bg-border-dark px-unit-xl font-label-caps text-label-caps uppercase text-surface-canvas transition-all duration-150 hover:bg-primary"
            >
              {t("home.viewAll")}
              <ArrowIcon />
            </Link>
          </div>
          <ProductGrid items={products} initial={products.length} step={0} cols={4} />
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-unit-2xs">
      <dt className="font-label-caps-sm text-label-caps-sm uppercase text-text-muted">
        {label}
      </dt>
      <dd className="font-mono-technical text-headline-sm font-bold tabular-nums text-primary">
        {value}
      </dd>
    </div>
  );
}