"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import ProductGrid from "@/components/ProductGrid";
import { CloseIcon, IconButton } from "@/components/ui";
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

function Count({ n }: { n: number }) {
  return <span className="font-mono-technical text-label-caps">{n}</span>;
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
    if (slug === "all") return t("category.all");
    const cat = CATEGORIES.find((c) => c.slug === slug);
    return cat ? t(categoryLabelKey(cat.slug)) : t("category.all");
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
    if (sort === "priceLow") out = [...out].sort((a, z) => a.price - z.price);
    if (sort === "priceHigh") out = [...out].sort((a, z) => z.price - a.price);
    if (sort === "newest")
      out = [...out].sort((a, z) =>
        a.promo === "justIn" ? -1 : z.promo === "justIn" ? 1 : 0
      );
    return out;
  }, [base, size, band, promo, sort, gender, subcat]);

  const count = (fn: (p: (typeof base)[number]) => boolean) =>
    base.filter(fn).length;

  const activeCount =
    (size !== null ? 1 : 0) +
    (band !== 0 ? 1 : 0) +
    (promo !== null ? 1 : 0) +
    (gender !== null ? 1 : 0) +
    (subcat !== null ? 1 : 0);

  const clearAll = () => {
    setSize(null);
    setBand(0);
    setPromo(null);
    setGender(null);
    setSubcat(null);
    syncUrl(null, null);
  };

  const hasFilters = activeCount > 0;
  const cat = slug === "all" ? null : (slug as CategorySlug);

  const ModuleLabel = "font-label-caps text-label-caps uppercase tracking-wider text-primary";
  const bandLabel = (i: number) =>
    i === 0 ? t("price.all") : t(`price.b${i}` as "price.all");

  const Filters = (
    <form className="flex flex-col divide-y divide-border-rule text-body-utility">
      {slug === "all" && (
        <div className="flex flex-col gap-unit-sm p-unit-md">
          <span className={ModuleLabel}>{t("plp.category")}</span>
          <div className="flex flex-col gap-unit-2xs">
            {CATEGORIES.map((c) => {
              const n = getProductsByCategory(c.label as Category).length;
              return (
                <a
                  key={c.slug}
                  href={`/category/${c.slug}`}
                  className="flex items-center justify-between py-1 pl-unit-xs font-label-caps-sm text-label-caps-sm text-text-muted transition-colors hover:font-bold hover:text-primary"
                >
                  <span>{t(categoryLabelKey(c.slug))}</span>
                  <Count n={n} />
                </a>
              );
            })}
          </div>
        </div>
      )}

      {cat && (
        <div className="flex flex-col gap-unit-sm p-unit-md">
          <span className={ModuleLabel}>{t("plp.subcategory")}</span>
          <div className="flex flex-col gap-unit-2xs">
            {SUBCATEGORIES_BY_CATEGORY[cat].map((s) => {
              const isActive = subcat === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSub(s)}
                  className={`flex items-center justify-between border-l-2 px-2 py-1 text-left font-label-caps-sm text-label-caps-sm transition-colors ${
                    isActive
                      ? "border-primary font-bold text-primary"
                      : "border-transparent text-text-muted hover:text-primary"
                  }`}
                >
                  <span className="uppercase">{t(subcategoryLabelKey(s))}</span>
                  <Count n={count((p) => p.subcategory === s)} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-unit-sm p-unit-md">
        <span className={ModuleLabel}>{t("plp.gender")}</span>
        <div className="flex flex-col gap-unit-2xs font-mono-technical text-mono-technical">
          {(["WOMEN", "MEN"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => toggleGender(value)}
              className={`flex items-center justify-between border-b border-border-rule py-1 px-1 transition-colors ${
                gender === value
                  ? "font-bold text-primary"
                  : "text-text-muted hover:text-primary"
              }`}
            >
              <span className="uppercase">{t(genderLabelKey(value))}</span>
              <Count
                n={count(
                  (p) => p.gender === value || p.gender === "UNISEX"
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-unit-sm p-unit-md">
        <div className="flex items-center justify-between">
          <span className={ModuleLabel}>{t("plp.sizesGrid")}</span>
          <span className="font-label-caps-sm text-label-caps-sm text-text-muted">
            EU / US
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1 text-center font-mono-technical text-mono-technical">
          {ALL_SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(size === s ? null : s)}
              className={`py-2 uppercase transition-colors ${
                size === s
                  ? "border border-border-dark bg-primary font-bold text-on-primary"
                  : "border border-border-rule hover:border-primary hover:bg-surface-canvas"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-unit-sm p-unit-md">
        <div className="flex items-center justify-between">
          <span className={ModuleLabel}>{t("plp.priceRange")}</span>
          <span className="font-mono-technical text-label-caps font-bold text-primary">
            DZD
          </span>
        </div>
        <div className="flex flex-col gap-unit-2xs">
          {PRICE_BANDS.map((b, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setBand(band === i ? 0 : i)}
              className={`flex items-center justify-between py-1 pl-unit-xs text-left transition-colors ${
                band === i
                  ? "font-mono-technical font-bold text-primary"
                  : "font-mono-technical text-mono-technical text-text-muted hover:text-primary"
              }`}
            >
              <span className="uppercase">{bandLabel(i)}</span>
              <Count n={count((p) => b.min === null || p.price >= b.min)} />
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-unit-sm p-unit-md">
        <span className={ModuleLabel}>{t("plp.promo")}</span>
        <div className="flex flex-col gap-unit-2xs">
          {PROMOS.map((pr) => (
            <button
              key={pr}
              type="button"
              onClick={() => setPromo(promo === pr ? null : pr)}
              className={`flex items-center justify-between py-1 pl-unit-xs text-left transition-colors ${
                promo === pr
                  ? "font-mono-technical font-bold text-primary"
                  : "font-mono-technical text-mono-technical text-text-muted hover:text-primary"
              }`}
            >
              <span className="uppercase">{t(promoLabelKey(pr))}</span>
              <Count n={count((p) => p.promo === pr)} />
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-unit-xs bg-surface-canvas p-unit-md">
        <div className="flex items-center gap-unit-xs">
          <span className="h-2 w-2 bg-status-cod" />
          <span className="font-label-caps text-label-caps font-bold uppercase text-status-cod">
            {t("plp.security")}
          </span>
        </div>
        <label className="flex cursor-pointer items-center gap-unit-sm pt-1">
          <input
            type="checkbox"
            checked
            readOnly
            className="h-3.5 w-3.5 cursor-pointer rounded-none border border-border-dark accent-status-cod"
          />
          <span className="font-mono-technical text-mono-technical text-primary">
            {t("plp.codAccepted")}
          </span>
        </label>
        <span className="mt-1 font-label-caps-sm text-label-caps-sm uppercase leading-tight text-text-muted">
          {t("plp.codNote")}
        </span>
      </div>

      {hasFilters ? (
        <div className="p-unit-md">
          <button
            type="button"
            onClick={clearAll}
            className="press focus-kill font-label-caps-sm text-label-caps-sm uppercase text-accent-crimson transition-colors hover:underline"
          >
            {t("plp.resetAll")}
          </button>
        </div>
      ) : null}
    </form>
  );

  return (
    <>
      {/* System status bar / archive index header */}
      <section className="w-full border-b border-border-rule bg-surface-paper px-margin-mobile py-unit-xl sm:px-margin-desktop">
        <div className="flex flex-col gap-unit-md">
          <div className="flex items-center justify-between font-mono-technical text-mono-technical text-text-muted">
            <div className="flex items-center gap-unit-xs uppercase">
              <Link href="/" className="transition-colors hover:text-primary">
                {t("plp.breadcrumbBase")}
              </Link>
              <span>/</span>
              <span className="font-bold text-primary">{title}</span>
              <span>/</span>
              <span className="text-status-cod">
                {t("plp.wilayasEligible")}
              </span>
            </div>
            <div className="hidden items-center gap-unit-md sm:flex">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent-crimson" />
              <span className="font-label-caps-sm text-label-caps-sm uppercase tracking-widest">
                {t("plp.hubStatus")}
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-unit-lg pt-unit-xs lg:flex-row lg:items-end">
            <div>
              <div className="flex items-baseline gap-unit-sm">
                <h1 className="font-headline-lg text-headline-lg uppercase tracking-tight text-primary">
                  {title}
                </h1>
                <span className="font-mono-technical text-label-caps font-bold text-accent-crimson">
                  [{items.length} {t("plp.archives")}]
                </span>
              </div>
              <p className="mt-1 font-body-editorial text-body-editorial text-text-muted">
                {items.length}{" "}
                {items.length === 1 ? t("plp.resultOne") : t("plp.results")}
              </p>
            </div>

            <div className="flex items-center gap-unit-sm self-start lg:self-end">
              <label htmlFor="sort-select" className="font-label-caps text-label-caps uppercase text-text-muted">
                {t("plp.sortBy")}:
              </label>
              <div className="relative">
                <select
                  id="sort-select"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as Sort)}
                  className="cursor-pointer appearance-none rounded-none border border-border-dark bg-surface-canvas px-unit-md py-unit-xs pr-8 font-mono-technical text-mono-technical uppercase text-primary focus:bg-surface-paper focus:outline-none"
                >
                  <option value="featured">{t("plp.sortFeatured")}</option>
                  <option value="priceLow">{t("plp.sortPriceLow")}</option>
                  <option value="priceHigh">{t("plp.sortPriceHigh")}</option>
                  <option value="newest">{t("plp.sortNewest")}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active filters pill strip */}
          {hasFilters ? (
            <div className="flex flex-wrap items-center gap-unit-xs border-t border-border-rule pt-unit-sm">
              <span className="mr-unit-xs font-label-caps-sm text-label-caps-sm uppercase text-text-muted">
                {t("plp.filtersActive", { n: activeCount })}
              </span>
              {gender !== null ? (
                <Pill
                  label={t(genderLabelKey(gender))}
                  onRemove={() => toggleGender(gender)}
                />
              ) : null}
              {subcat !== null ? (
                <Pill
                  label={t(subcategoryLabelKey(subcat))}
                  onRemove={() => toggleSub(subcat)}
                />
              ) : null}
              {size !== null ? (
                <Pill label={size} onRemove={() => setSize(null)} />
              ) : null}
              {band !== 0 ? (
                <Pill label={bandLabel(band)} onRemove={() => setBand(0)} />
              ) : null}
              {promo !== null ? (
                <Pill
                  label={t(promoLabelKey(promo))}
                  onRemove={() => setPromo(null)}
                />
              ) : null}
              <button
                type="button"
                onClick={clearAll}
                className="ml-unit-xs font-label-caps-sm text-label-caps-sm uppercase text-accent-crimson hover:underline"
              >
                {t("plp.resetAll")}
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {/* Main matrix */}
      <div className="w-full px-margin-mobile py-unit-xl sm:px-margin-desktop">
        <div className="grid grid-cols-1 items-start gap-gutter-desktop lg:grid-cols-12">
          {/* Left filter rail */}
          <aside className="flex flex-col border border-border-rule bg-surface-paper lg:sticky lg:top-28 lg:col-span-3">
            <div className="flex items-center justify-between border-b border-border-rule bg-surface-canvas p-unit-md">
              <div className="flex items-center gap-unit-xs">
                <span className="font-label-caps text-label-caps uppercase text-primary">
                  {t("plp.filters")}
                </span>
              </div>
              <span className="font-mono-technical text-label-caps-sm text-text-muted">
                {t("plp.filtersActive", { n: activeCount })}
              </span>
            </div>
            {Filters}
          </aside>

          {/* Product matrix */}
          <section className="flex flex-col gap-unit-xl lg:col-span-9">
            {items.length === 0 ? (
              <div className="flex flex-col items-start gap-4 border border-border-rule bg-surface-paper px-unit-lg py-unit-2xl">
                <h2 className="font-headline-lg text-headline-lg uppercase tracking-tight text-primary">
                  {t("plp.noResultsTitle")}
                </h2>
                <p className="max-w-[40ch] font-body-editorial text-body-editorial text-text-muted">
                  {t("plp.noResultsDesc")}
                </p>
                <button
                  type="button"
                  onClick={clearAll}
                  className="press focus-kill mt-2 inline-flex h-12 items-center justify-center bg-primary px-unit-md font-label-caps text-label-caps uppercase text-on-primary transition-colors hover:bg-accent-crimson"
                >
                  {t("plp.clearFilters")}
                </button>
              </div>
            ) : (
              <>
                <ProductGrid key={sort} items={items} initial={12} step={8} cols={3} />
                {/* Status + trust bar */}
                <div className="mt-unit-lg flex w-full flex-col items-center gap-unit-md border border-border-rule bg-surface-paper p-unit-xl text-center">
                  <div className="flex w-full max-w-md items-center justify-between font-mono-technical text-mono-technical">
                    <span className="uppercase text-text-muted">
                      {t("plp.statusBar", {
                        shown: Math.min(12, items.length),
                        total: items.length,
                      })}
                    </span>
                    <span className="font-bold text-primary">
                      {t("plp.explored", {
                        pct: Math.min(100, Math.round((12 / Math.max(items.length, 1)) * 100)),
                      })}
                    </span>
                  </div>
                  <div className="relative h-1 w-full max-w-md overflow-hidden border border-border-rule bg-surface-canvas">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${Math.min(100, Math.round((12 / Math.max(items.length, 1)) * 100))}%`,
                      }}
                    />
                  </div>
                  <span className="font-label-caps-sm text-label-caps-sm uppercase text-text-muted">
                    {t("plp.trust")}
                  </span>
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {/* Editorial footnote banner */}
      <section className="w-full border-t border-border-rule bg-surface-canvas px-margin-mobile py-unit-2xl sm:px-margin-desktop">
        <div className="grid grid-cols-1 gap-unit-xl md:grid-cols-3">
          <Footnote>
            <span className="font-mono-technical text-label-caps-sm font-bold uppercase text-status-cod">
              01 / {t("plp.foot1.kicker")}
            </span>
            <h4 className="font-headline-sm text-headline-sm uppercase text-primary">
              {t("plp.foot1.title")}
            </h4>
            <p className="font-body-utility text-body-utility text-text-muted">
              {t("plp.foot1.body")}
            </p>
          </Footnote>
          <Footnote>
            <span className="font-mono-technical text-label-caps-sm font-bold uppercase text-status-cod">
              02 / {t("plp.foot2.kicker")}
            </span>
            <h4 className="font-headline-sm text-headline-sm uppercase text-primary">
              {t("plp.foot2.title")}
            </h4>
            <p className="font-body-utility text-body-utility text-text-muted">
              {t("plp.foot2.body")}
            </p>
          </Footnote>
          <Footnote>
            <span className="font-mono-technical text-label-caps-sm font-bold uppercase text-accent-crimson">
              03 / {t("plp.foot3.kicker")}
            </span>
            <h4 className="font-headline-sm text-headline-sm uppercase text-primary">
              {t("plp.foot3.title")}
            </h4>
            <p className="font-body-utility text-body-utility text-text-muted">
              {t("plp.foot3.body")}
            </p>
          </Footnote>
        </div>
      </section>

      {/* Mobile filter drawer */}
      <div
        onClick={() => setMobileFilters(false)}
        className={`fixed inset-0 z-50 bg-surface-charcoal/40 transition-opacity duration-300 lg:hidden ${
          mobileFilters ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
      />
      <aside
        className={`fixed bottom-0 left-0 top-0 z-50 w-80 max-w-[85vw] overflow-y-auto border-r border-border-rule bg-surface-paper transition-transform duration-300 ease-out lg:hidden ${
          mobileFilters ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label={t("plp.showFilters")}
      >
        <div className="mb-2 flex items-center justify-between border-b border-border-rule px-unit-md py-4">
          <h2 className="font-label-caps text-label-caps uppercase text-primary">
            {t("plp.filters")}
          </h2>
          <IconButton
            label={t("cart.close")}
            onClick={() => setMobileFilters(false)}
            className="h-10 w-10 border border-border-rule bg-surface-paper"
          >
            <CloseIcon className="h-4 w-4" />
          </IconButton>
        </div>
        {Filters}
        <div className="p-unit-md">
          <button
            type="button"
            onClick={() => setMobileFilters(false)}
            className="press focus-kill inline-flex h-12 w-full items-center justify-center bg-primary px-unit-md font-label-caps text-label-caps uppercase text-on-primary"
          >
            {t("cart.viewCatalogue")}
          </button>
        </div>
      </aside>
    </>
  );
}

function Pill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="inline-flex items-center gap-unit-xs border border-border-dark bg-surface-canvas px-unit-sm py-1 font-mono-technical text-label-caps text-primary">
      <span className="uppercase">{label}</span>
      <button
        type="button"
        aria-label={`Remove filter ${label}`}
        onClick={onRemove}
        className="flex items-center transition-colors hover:text-accent-crimson"
      >
        <CloseIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function Footnote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-unit-xs border-l border-border-dark pl-unit-md">
      {children}
    </div>
  );
}