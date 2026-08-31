"use client";

import Image from "next/image";
import Link from "next/link";
import { useLang, categoryLabelKey } from "@/lib/i18n";
import {
  CATEGORIES,
  CATEGORY_ACCENT,
  FEATURED_IDS,
  PRODUCTS,
  asset,
  getProduct,
  placeholder,
} from "@/lib/mock";
import ProductCard from "@/components/ProductCard";
import ProductGrid from "@/components/ProductGrid";
import { ButtonLink, SectionHeader } from "@/components/ui";

export default function HomeView() {
  const { t } = useLang();

  const trending = FEATURED_IDS.map(getProduct).filter(
    (p): p is NonNullable<typeof p> => Boolean(p)
  );

  const sectionGap = "pt-12 sm:pt-14";

  return (
    <div>
      {/* Campaign hero — mobile: copy stacked ABOVE the full photo (no overlap).
          Desktop: photo right via contain, copy overlaid left over the scrim. */}
      <section className="relative overflow-hidden bg-soft-cloud">
        <div className="relative flex flex-col sm:aspect-[21/10] sm:block">
          <div className="relative z-10 flex flex-col items-start gap-4 px-5 pb-6 pt-10 sm:absolute sm:inset-0 sm:justify-center sm:px-8 sm:py-0">
            <h1 className="font-display text-[15vw] font-normal uppercase leading-[0.85] tracking-tight text-ink sm:text-7xl lg:text-[96px]">
              {t("hero.title")}
            </h1>
            <p className="max-w-[46ch] text-sm leading-6 text-ink/70 sm:text-base">
              {t("hero.subtitle")}
            </p>
            <ButtonLink
              href="/category/all"
              variant="on-image"
              className="mt-1 border border-hairline"
            >
              {t("hero.cta")}
            </ButtonLink>
          </div>
          <div className="relative aspect-[4/5] w-full sm:absolute sm:inset-0 sm:aspect-auto">
            {/* Homepage hero image — slot "hero-home". Set it in IMAGE_MAP (lib/mock.ts). */}
            <Image
              src={asset("hero-home", placeholder("abyss-hero", 1200, 1500))}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-contain object-center sm:object-[80%_center]"
            />
            <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-canvas/95 via-canvas/15 to-transparent sm:block" />
          </div>
        </div>
      </section>

      {/* Trending Now */}
      <section className={`${sectionGap} flex flex-col gap-6`}>
        <SectionHeader
          title={t("home.trending")}
          viewAllHref="/category/all"
          viewAllLabel={t("home.viewAll")}
        />
        <div className="no-scrollbar flex snap-x gap-1 overflow-x-auto px-5 sm:gap-2 sm:px-8">
          {trending.map((p) => (
            <div key={p.id} className="w-[46%] shrink-0 snap-start sm:w-[280px]">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </section>

      {/* Shop by Category */}
      <section className={`${sectionGap} flex flex-col gap-6`}>
        <SectionHeader title={t("home.shopByCategory")} />
        <div className="grid grid-cols-2 gap-1 px-5 sm:gap-2 sm:px-8 lg:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="group relative block aspect-[4/5] overflow-hidden bg-soft-cloud"
            >
              {/* Category tile image — slots "category-apparel" .. "category-outerwear". */}
              <Image
                src={asset(
                  `category-${c.slug}`,
                  placeholder(`abyss-cat-${c.slug}`, 800, 1000)
                )}
                alt={t(categoryLabelKey(c.slug))}
                fill
                sizes="(min-width:1024px) 25vw, (min-width:768px) 50vw, 50vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
              />
              <span className="absolute left-3 top-3 flex items-center gap-2 rounded-lg bg-canvas px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-ink">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: CATEGORY_ACCENT[c.label] }}
                />
                {t(categoryLabelKey(c.slug))}
              </span>
              <span className="absolute bottom-3 left-3 inline-flex h-10 items-center rounded-lg bg-canvas px-5 text-sm font-medium lowercase text-ink">
                {t("home.shop")}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest in the Catalogue */}
      <section className={`${sectionGap} flex flex-col gap-6 pb-4`}>
        <SectionHeader
          title={t("home.latest")}
          viewAllHref="/category/all"
          viewAllLabel={t("home.viewAll")}
        />
        <div className="px-2 sm:px-6">
          <ProductGrid items={PRODUCTS} initial={12} step={8} cols={4} />
        </div>
      </section>
    </div>
  );
}