"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import ProductGrid from "@/components/ProductGrid";
import { IconButton } from "@/components/ui";
import {
  useLang,
  categoryLabelKey,
  subcategoryLabelKey,
  genderLabelKey,
  promoLabelKey,
} from "@/lib/i18n";
import {
  ALL_SIZES,
  CAT_SLUG_TO_LABEL,
  CATEGORIES,
  PRICE_BANDS,
  PRODUCTS,
  SUBCATEGORIES_BY_CATEGORY,
  getProductsByCategory,
  type Category,
  type CategorySlug,
  type Gender,
  type Promo,
} from "@/lib/mock";

type Sort = "featured" | "priceLow" | "priceHigh" | "newest";

const PROMOS: Promo[] = ["justIn", "recycled", "limited"];

const GROUP_TITLE =
  "mb-3 text-sm font-medium uppercase tracking-wide text-ink";

function Count({ n }: { n: number }) {
  return (
    <span className="ml-1 text-xs tabular-nums text-mute">({n})</span>
  );
}

export default function CategoryView({
  slug,
  g,
  sub,
}: {
  slug: string;
  g?: string;
  sub?: string;
}) {
  const { t } = useLang();
  const router = useRouter();
  const [hideFilters, setHideFilters] = useState(false);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [size, setSize] = useState<string | null>(null);
  const [band, setBand] = useState<number>(0);
  const [promo, setPromo] = useState<Promo | null>(null);
  const [sort, setSort] = useState<Sort>("featured");
  const [gender, setGender] = useState<Exclude<Gender, "UNISEX"> | null>(
    g === "WOMEN" || g === "MEN" ? g : null
  );
  const [subcat, setSubcat] = useState<string | null>(
    slug !== "all" &&
      sub &&
      SUBCATEGORIES_BY_CATEGORY[slug as CategorySlug].includes(sub)
      ? sub
      : null
  );

  // Keep gender/subcategory reflected in the URL so the nav flyouts and the
  // back/forward buttons stay honest.
  const syncUrl = (
    nextGender: Exclude<Gender, "UNISEX"> | null,
    nextSub: string | null
  ) => {
    const q = new URLSearchParams();
    if (nextGender) q.set("g", nextGender);
    if (nextSub) q.set("sub", nextSub);
    const qs = q.toString();
    router.replace(`/category/${slug}${qs ? `?${qs}` : ""}`, {
      scroll: false,
    });
  };

  const toggleGender = (value: Exclude<Gender, "UNISEX">) => {
    const next = gender === value ? null : value;
    setGender(next);
    syncUrl(next, subcat);
  };

  const toggleSub = (value: string) => {
    const next = subcat === value ? null : value;
    setSubcat(next);
    syncUrl(gender, next);
  };

  const title = useMemo(() => {
    if (slug === "all") return "All";
    const cat = CATEGORIES.find((c) => c.slug === slug);
    return cat ? t(categoryLabelKey(cat.slug)) : "All";
  }, [slug, t]);

  const base = useMemo(() => {
    if (slug === "all") return PRODUCTS;
    return getProductsByCategory(CAT_SLUG_TO_LABEL[slug as CategorySlug]);
  }, [slug]);

  const items = useMemo(() => {
    const b = PRICE_BANDS[band];
    let out = base.filter(
      (p) =>
        (size === null || p.sizes.includes(size)) &&
        (b.min === null || p.price >= b.min) &&
        (b.max === null || p.price <= b.max) &&
        (promo === null || p.promo === promo) &&
        (gender === null ||
          p.gender === gender ||
          p.gender === "UNISEX") &&
        (subcat === null || p.subcategory === subcat)
    );
    if (sort === "priceLow")
      out = [...out].sort((a, z) => a.price - z.price);
    if (sort === "priceHigh")
      out = [...out].sort((a, z) => z.price - a.price);
    if (sort === "newest")
      out = [...out].sort((a, z) =>
        a.promo === "justIn" ? -1 : z.promo === "justIn" ? 1 : 0
      );
    return out;
  }, [base, size, band, promo, sort, gender, subcat]);

  const count = (fn: (p: (typeof base)[number]) => boolean) =>
    base.filter(fn).length;

  const clearAll = () => {
    setSize(null);
    setBand(0);
    setPromo(null);
    setGender(null);
    setSubcat(null);
    syncUrl(null, null);
  };

  const hasFilters =
    size !== null || band !== 0 || promo !== null || gender !== null || subcat !== null;

  const cat = slug === "all" ? null : (slug as CategorySlug);

  const Filters = (
    <div className="flex flex-col gap-8">
      {slug === "all" && (
        <div>
          <h3 className={GROUP_TITLE}>{t("plp.category")}</h3>
          <div className="flex flex-col items-start gap-1">
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                className="text-sm text-mute transition-colors hover:text-ink"
              >
                {t(categoryLabelKey(c.slug))}
                <Count n={getProductsByCategory(c.label as Category).length} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {cat && (
        <div>
          <h3 className={GROUP_TITLE}>{t("plp.subcategory")}</h3>
          <div className="flex flex-col items-start gap-1">
            {SUBCATEGORIES_BY_CATEGORY[cat].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSub(s)}
                className={`text-sm transition-colors ${
                  subcat === s
                    ? "font-medium text-ink"
                    : "text-mute hover:text-ink"
                }`}
              >
                {t(subcategoryLabelKey(s))}
                <Count n={count((p) => p.subcategory === s)} />
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className={GROUP_TITLE}>{t("plp.gender")}</h3>
        <div className="flex flex-col items-start gap-1">
          <button
            type="button"
            onClick={() => toggleGender("WOMEN")}
            className={`text-sm transition-colors ${
              gender === "WOMEN"
                ? "font-medium text-ink"
                : "text-mute hover:text-ink"
            }`}
          >
            {t(genderLabelKey("WOMEN"))}
            <Count
              n={count(
                (p) => p.gender === "WOMEN" || p.gender === "UNISEX"
              )}
            />
          </button>
          <button
            type="button"
            onClick={() => toggleGender("MEN")}
            className={`text-sm transition-colors ${
              gender === "MEN"
                ? "font-medium text-ink"
                : "text-mute hover:text-ink"
            }`}
          >
            {t(genderLabelKey("MEN"))}
            <Count
              n={count((p) => p.gender === "MEN" || p.gender === "UNISEX")}
            />
          </button>
          {gender !== null && (
            <button
              type="button"
              onClick={() => toggleGender(gender)}
              className="text-sm text-sale"
            >
              {t("plp.any")}
            </button>
          )}
        </div>
      </div>

      <div>
        <h3 className={GROUP_TITLE}>{t("plp.size")}</h3>
        <div className="flex flex-wrap gap-2">
          {ALL_SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(size === s ? null : s)}
              className={`focus-kill press h-9 min-w-9 rounded-lg border px-2 text-sm transition-colors ${
                size === s
                  ? "border-ink bg-ink text-on-primary"
                  : "border-hairline bg-canvas text-charcoal hover:border-ink"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className={GROUP_TITLE}>{t("plp.price")}</h3>
        <div className="flex flex-col items-start gap-1">
          {PRICE_BANDS.map((b, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setBand(band === i ? 0 : i)}
              className={`text-sm transition-colors ${
                band === i ? "font-medium text-ink" : "text-mute hover:text-ink"
              }`}
            >
              {i === 0 ? t("price.all") : t(`price.b${i}` as "price.all")}
              <Count n={count((p) => b.min === null || p.price >= b.min)} />
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className={GROUP_TITLE}>{t("plp.promo")}</h3>
        <div className="flex flex-col items-start gap-1">
          {PROMOS.map((pr) => (
            <button
              key={pr}
              type="button"
              onClick={() => setPromo(promo === pr ? null : pr)}
              className={`text-sm transition-colors ${
                promo === pr
                  ? "font-medium text-ink"
                  : "text-mute hover:text-ink"
              }`}
            >
              {t(promoLabelKey(pr))}
              <Count n={count((p) => p.promo === pr)} />
            </button>
          ))}
        </div>
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="self-start text-xs font-medium uppercase tracking-wide text-ink underline underline-offset-4 transition-opacity hover:opacity-60"
        >
          {t("plp.clearAll")}
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Header */}
      <div className="px-5 pt-8 sm:px-8">
        <div className="flex items-center gap-2 text-xs text-mute">
          <Link href="/" className="transition-colors hover:text-ink">
            {t("category.all")}
          </Link>
          <Chevron />
          <span className="text-ink">{title}</span>
          {subcat && (
            <>
              <Chevron />
              <span className="text-ink">
                {t(subcategoryLabelKey(subcat))}
              </span>
            </>
          )}
        </div>
        <h1 className="mt-3 text-[28px] font-medium uppercase tracking-tight text-ink sm:text-[32px]">
          {title}
        </h1>
        <p className="mt-1 text-sm text-mute">
          {items.length} {items.length === 1 ? t("plp.resultOne") : t("plp.results")}
        </p>
      </div>

      {/* Sub-nav */}
      <div className="sticky top-0 z-30 mt-6 border-y border-hairline-soft bg-canvas">
        <div className="flex items-center justify-between px-5 py-3 sm:px-8">
          <button
            type="button"
            onClick={() => setHideFilters((v) => !v)}
            className="focus-kill flex items-center gap-2 text-sm font-medium uppercase text-ink"
          >
            {hideFilters ? t("plp.showFilters") : t("plp.hideFilters")}
            <span className="flex flex-col">
              <span className="h-px w-3 bg-ink" />
              <span className="mt-0.5 h-px w-3 bg-ink" />
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileFilters(true)}
              className="focus-kill mr-1 text-sm font-medium uppercase text-ink lg:hidden"
            >
              {t("plp.showFilters")}
            </button>
            <label className="hidden items-center gap-2 text-sm text-mute lg:flex">
              <span className="uppercase">{t("plp.sortBy")}</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="cursor-pointer rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ink focus-kill focus:border-ink"
              >
                <option value="featured">{t("plp.sortFeatured")}</option>
                <option value="priceLow">{t("plp.sortPriceLow")}</option>
                <option value="priceHigh">{t("plp.sortPriceHigh")}</option>
                <option value="newest">{t("plp.sortNewest")}</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mt-6 flex gap-10 px-2 sm:px-6">
        {!hideFilters && (
          <aside className="hidden w-56 shrink-0 px-6 lg:block">
            <div className="sticky top-24 pb-12">{Filters}</div>
          </aside>
        )}
        <div className="min-w-0 flex-1">
          {items.length === 0 ? (
            <div className="flex flex-col items-start gap-4 px-6 py-12">
              <h2 className="font-display text-2xl font-normal uppercase tracking-tight text-ink">
                {t("plp.noResultsTitle")}
              </h2>
              <p className="max-w-[40ch] text-sm leading-6 text-charcoal">
                {t("plp.noResultsDesc")}
              </p>
              <button
                type="button"
                onClick={clearAll}
                className="press focus-kill mt-2 inline-flex h-12 items-center justify-center rounded-lg bg-ink px-8 text-sm font-medium lowercase text-on-primary transition-colors hover:bg-charcoal"
              >
                {t("plp.clearFilters")}
              </button>
            </div>
          ) : (
            <ProductGrid
              key={sort}
              items={items}
              initial={12}
              step={8}
              cols={4}
            />
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <div
        onClick={() => setMobileFilters(false)}
        className={`fixed inset-0 z-50 bg-ink/30 transition-opacity duration-300 lg:hidden ${
          mobileFilters ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
      />
      <aside
        className={`fixed bottom-0 left-0 top-0 z-50 w-80 max-w-[85vw] overflow-y-auto bg-canvas px-8 py-6 transition-transform duration-300 ease-out lg:hidden ${
          mobileFilters ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label={t("plp.showFilters")}
      >
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-lg font-medium uppercase text-ink">
            {t("plp.showFilters")}
          </h2>
          <IconButton label={t("cart.close")} onClick={() => setMobileFilters(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 6 L18 18 M18 6 L6 18" />
            </svg>
          </IconButton>
        </div>
        {Filters}
        <button
          type="button"
          onClick={() => setMobileFilters(false)}
          className="press focus-kill mt-10 inline-flex h-12 w-full items-center justify-center rounded-lg bg-ink px-8 text-sm font-medium lowercase text-on-primary transition-colors hover:bg-charcoal"
        >
          {t("cart.viewCatalogue")}
        </button>
      </aside>
    </>
  );
}

function Chevron() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 6 L15 12 L9 18" />
    </svg>
  );
}