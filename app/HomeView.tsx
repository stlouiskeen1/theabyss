"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLang, categoryLabelKey, promoLabelKey } from "@/lib/i18n";
import {
  CATEGORIES,
  FEATURED_IDS,
  PRODUCTS,
  SELLERS,
  asset,
  formatPrice,
  getProduct,
  placeholder,
} from "@/lib/mock";
import { useWishlist } from "@/lib/wishlist";
import ProductGrid from "@/components/ProductGrid";
import {
  ArrowIcon,
  BoltIcon,
  PaymentsIcon,
  VerifiedIcon,
  WishlistButton,
} from "@/components/ui";

/** Editorial boutique index codes — supersede seller ids for the strip. */
const INDEX_CODES: Record<string, string> = {
  s1: "16-HYD",
  s2: "16-SYH",
  s3: "31-ORN",
  s4: "25-CST",
};

export default function HomeView() {
  const { t } = useLang();
  const [subscribed, setSubscribed] = useState(false);

  const featured = FEATURED_IDS.map(getProduct).filter(Boolean) as NonNullable<
    ReturnType<typeof getProduct>
  >[];
  const cosmos = featured.slice(0, 5);
  const heroLead = featured[0] ?? PRODUCTS[0];
  const heroSide = featured[1] ?? PRODUCTS[1];

  const sectionPad = "w-full px-margin-mobile sm:px-margin-desktop";

  return (
    <div>
      {/* ============ SECTION 1: EDITORIAL HERO (bleeds under fixed header) ============ */}
      <section className="relative w-full -mt-16 sm:-mt-24 overflow-hidden bg-surface-canvas pt-16 sm:pt-24">
        <div className={`${sectionPad} py-unit-xl lg:py-unit-3xl`}>
          <div className="grid grid-cols-1 items-end gap-unit-md lg:grid-cols-12">
            <div className="flex flex-col gap-unit-md lg:col-span-8">
              <div className="flex items-center gap-unit-xs">
                <span className="inline-block h-2 w-2 bg-accent-crimson" />
                <span className="font-label-caps-sm text-label-caps-sm uppercase tracking-widest text-primary">
                  {t("home.dropIndex")}
                </span>
              </div>
              <h1 className="font-display-hero text-display-hero-mobile uppercase leading-none tracking-tighter text-primary sm:text-display-hero">
                {t("home.heroTitle")}
              </h1>
              <p className="max-w-2xl font-body-editorial text-body-editorial text-text-muted">
                {t("home.heroSub")}
              </p>
              <div className="flex flex-wrap items-center gap-unit-md pt-unit-sm">
                <a
                  href="#discovery-archive"
                  className="press focus-kill inline-flex h-12 items-center justify-center bg-border-dark px-unit-xl font-label-caps text-label-caps uppercase text-surface-canvas transition-all duration-150 hover:bg-surface-paper hover:text-border-dark hover:shadow-md"
                >
                  {t("home.exploreDrops")}
                </a>
                <a
                  href="#boutiques-index"
                  className="press focus-kill inline-flex h-12 items-center justify-center bg-surface-paper px-unit-xl font-label-caps text-label-caps uppercase text-border-dark shadow-sm transition-all duration-150 hover:bg-border-dark hover:text-surface-paper"
                >
                  {t("home.seeBoutiques")}
                </a>
              </div>
            </div>

            {/* Coverage card */}
            <div className="flex flex-col justify-end lg:col-span-4">
              <div className="flex flex-col gap-unit-xs bg-surface-paper p-unit-md shadow-sm">
                <div className="flex items-center justify-between font-mono-technical text-mono-technical">
                  <span className="uppercase text-text-muted">
                    {t("home.coverage")}
                  </span>
                  <span className="font-bold text-status-cod">
                    {t("home.coverageVal")}
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden bg-surface-container-highest">
                  <div className="h-full w-3/4 bg-accent-crimson" />
                </div>
                <div className="flex items-center justify-between pt-unit-xs font-label-caps-sm text-label-caps-sm text-text-muted">
                  <span className="uppercase">{t("home.hub")}</span>
                  <span className="font-mono-technical text-primary">
                    {t("home.authenticated")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Architectural editorial showcase */}
          <div className="mt-unit-xl grid grid-cols-1 gap-unit-md lg:grid-cols-12">
            <Link
              href={`/product/${heroLead.id}`}
              className="group relative block overflow-hidden bg-surface-charcoal aspect-[16/9] lg:col-span-8 lg:aspect-[21/9]"
            >
              {/* Hero capsule — slot "hero-capsule". Set it in IMAGE_MAP (lib/mock.ts). */}
              <Image
                src={asset(
                  "hero-capsule",
                  placeholder("abyss-capsule", 1200, 800)
                )}
                alt=""
                fill
                sizes="(min-width:1024px) 66vw, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-border-dark/80 via-transparent to-transparent p-unit-lg text-surface-canvas">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-label-caps-sm text-label-caps-sm uppercase tracking-widest text-accent-crimson">
                      {t("home.capsule")}
                    </span>
                    <p className="font-headline-sm text-headline-sm uppercase tracking-tight text-surface-paper">
                      {heroLead.name}
                    </p>
                  </div>
                  <span className="bg-surface-paper/20 px-unit-sm py-1 font-mono-technical text-mono-technical backdrop-blur-md">
                    {formatPrice(heroLead.price)}
                  </span>
                </div>
              </div>
            </Link>

            <Link
              href={`/product/${heroSide.id}`}
              className="group relative block overflow-hidden bg-surface-charcoal aspect-square lg:col-span-4 lg:aspect-auto"
            >
              {/* Hero accent — slot "hero-accent". Set it in IMAGE_MAP (lib/mock.ts). */}
              <Image
                src={asset(
                  "hero-accent",
                  placeholder("abyss-accent", 800, 800)
                )}
                alt=""
                fill
                sizes="(min-width:1024px) 33vw, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-border-dark/80 via-transparent to-transparent p-unit-lg text-surface-canvas">
                <span className="font-label-caps-sm text-label-caps-sm uppercase tracking-widest text-surface-container-highest">
                  {heroSide.sellerName}
                </span>
                <p className="font-headline-sm text-headline-sm uppercase tracking-tight text-surface-paper">
                  {heroSide.name}
                </p>
                <span className="mt-unit-2xs font-mono-technical text-mono-technical font-bold text-accent-crimson">
                  {formatPrice(heroSide.price)}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ============ SECTION 2: CURATED BOUTIQUES STRIP ============ */}
      <section id="boutiques-index" className="w-full bg-surface-paper py-unit-2xl">
        <div className={sectionPad}>
          <div className="flex flex-col justify-between gap-unit-sm md:flex-row md:items-end">
            <div>
              <span className="font-label-caps text-label-caps uppercase tracking-widest text-accent-crimson">
                {t("home.partners")}
              </span>
              <h2 className="font-headline-lg text-headline-lg uppercase tracking-tighter text-primary">
                {t("home.partnersTitle")}
              </h2>
            </div>
            <p className="max-w-md font-body-utility text-body-utility text-text-muted">
              {t("home.partnersIndex")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-unit-md pb-unit-lg sm:grid-cols-2 lg:grid-cols-4">
            {SELLERS.slice(0, 4).map((seller) => {
              const pieceCount = PRODUCTS.filter(
                (p) => p.sellerId === seller.id
              ).length;
              return (
                <Link
                  key={seller.id}
                  href={`/seller/${seller.id}`}
                  className="group flex flex-col justify-between bg-surface-canvas p-unit-lg shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex flex-col gap-unit-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-label-caps-sm text-label-caps-sm font-bold uppercase text-accent-crimson">
                        {t("home.verified")}
                      </span>
                      <span className="font-mono-technical text-mono-technical text-text-muted">
                        {INDEX_CODES[seller.id] ?? seller.id.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="pt-unit-xs font-headline-sm text-headline-sm uppercase text-primary">
                      {seller.name}
                    </h3>
                    <p className="font-label-caps text-label-caps uppercase text-text-muted">
                      {seller.location}
                    </p>
                    <p className="line-clamp-2 pt-unit-xs font-body-utility text-body-utility text-text-muted">
                      {seller.about}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-unit-lg">
                    <span className="font-mono-technical text-mono-technical font-bold text-primary">
                      {t("home.piecesOnLine", { n: pieceCount })}
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center bg-surface-paper text-primary shadow-sm transition-colors group-hover:bg-border-dark group-hover:text-surface-paper">
                      <ArrowIcon />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ SECTION 3: COSMOS DISCOVERY GRID ============ */}
      <section id="discovery-archive" className="w-full bg-surface-canvas py-unit-3xl">
        <div className={sectionPad}>
          <div className="flex flex-col justify-between gap-unit-md pb-unit-xl lg:flex-row lg:items-center">
            <div>
              <span className="font-label-caps text-label-caps uppercase tracking-widest text-text-muted">
                {t("home.visualIndex")}
              </span>
              <h2 className="font-display-hero text-headline-lg uppercase tracking-tighter text-primary sm:text-headline-lg">
                {t("home.cosmosTitle")}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-unit-xs font-label-caps text-label-caps uppercase">
              <Link
                href="/category/all"
                className="press focus-kill bg-border-dark px-unit-md py-unit-xs text-surface-paper shadow-sm"
              >
                {t("home.showAll", { n: PRODUCTS.length })}
              </Link>
              {CATEGORIES.slice(0, 4).map((c) => (
                <Link
                  key={c.slug}
                  href={`/category/${c.slug}`}
                  className="press focus-kill bg-surface-paper px-unit-md py-unit-xs text-primary shadow-sm transition-colors hover:bg-surface-container-highest"
                >
                  {t(categoryLabelKey(c.slug))}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-unit-md md:grid-cols-2 lg:grid-cols-12">
            {cosmos.slice(0, 3).map((p, i) => (
              <CosmosCard
                key={p.id}
                product={p}
                wide={false}
                offset={i === 1}
              />
            ))}
            {cosmos.slice(3, 5).map((p) => (
              <CosmosCard key={p.id} product={p} wide />
            ))}
          </div>

          <div className="flex justify-center pt-unit-2xl">
            <Link
              href="/category/all"
              className="press focus-kill inline-flex h-12 items-center justify-center bg-surface-paper px-unit-2xl font-label-caps text-label-caps uppercase text-primary shadow-sm transition-all hover:bg-border-dark hover:text-surface-paper"
            >
              {t("home.loadMoreArchives")}
            </Link>
          </div>
        </div>
      </section>

      {/* ============ SECTION 4: EDITORIAL MANIFESTO / VALUE PILLARS ============ */}
      <section className="w-full bg-border-dark py-unit-3xl text-surface-paper">
        <div className={sectionPad}>
          <div className="max-w-4xl pb-unit-2xl">
            <span className="font-label-caps-sm text-label-caps-sm uppercase tracking-widest text-accent-crimson">
              {t("home.manifesto")}
            </span>
            <h2 className="pt-unit-xs font-display-hero text-headline-lg-mobile uppercase tracking-tighter text-surface-paper sm:text-headline-lg">
              {t("home.manifestoTitle")}
            </h2>
            <p className="pt-unit-sm font-body-editorial text-body-editorial leading-relaxed text-surface-container-highest">
              {t("home.manifestoBody")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-unit-xl md:grid-cols-3">
            <Pillar
              kicker={t("home.pillarA.kicker")}
              tone="text-accent-crimson"
              icon={<VerifiedIcon className="text-surface-paper" size={20} />}
              title={t("home.pillarA.title")}
              body={t("home.pillarA.body")}
              note={t("home.pillarA.note")}
            />
            <Pillar
              kicker={t("home.pillarB.kicker")}
              tone="text-status-cod"
              icon={<PaymentsIcon className="text-surface-paper" size={20} />}
              title={t("home.pillarB.title")}
              body={t("home.pillarB.body")}
              note={t("home.pillarB.note")}
            />
            <Pillar
              kicker={t("home.pillarC.kicker")}
              tone="text-surface-container-highest"
              icon={<BoltIcon className="text-surface-paper" size={20} />}
              title={t("home.pillarC.title")}
              body={t("home.pillarC.body")}
              note={t("home.pillarC.note")}
            />
          </div>
        </div>
      </section>

      {/* ============ SECTION 5: LIVE TICKER + NEWSLETTER ============ */}
      <section className="w-full bg-surface-canvas py-unit-2xl">
        {/* Live drops ticker */}
        <div className="flex w-full items-center gap-unit-lg overflow-hidden bg-surface-paper px-margin-desktop py-unit-sm shadow-sm">
          <div className="flex shrink-0 items-center gap-unit-xs">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent-crimson" />
            <span className="font-label-caps text-label-caps font-bold uppercase text-primary">
              {t("home.liveFeed")}
            </span>
          </div>
          <div className="flex items-center gap-unit-xl overflow-x-hidden whitespace-nowrap font-mono-technical text-mono-technical uppercase text-text-muted">
            <span className="font-bold text-primary">{t("home.feed.a")}</span>
            <span>•</span>
            <span className="font-bold text-primary">{t("home.feed.b")}</span>
            <span>•</span>
            <span className="font-bold text-primary">{t("home.feed.c")}</span>
            <span>•</span>
            <span className="font-bold text-primary">{t("home.feed.d")}</span>
          </div>
        </div>

        {/* Private drop alerts signup */}
        <div className={`${sectionPad} pt-unit-3xl`}>
          <div className="bg-surface-paper p-unit-xl shadow-sm sm:p-unit-3xl">
            <div className="grid grid-cols-1 items-center gap-unit-xl lg:grid-cols-12">
              <div className="flex flex-col gap-unit-xs lg:col-span-6">
                <span className="font-label-caps-sm text-label-caps-sm uppercase tracking-widest text-accent-crimson">
                  {t("home.newsletterKicker")}
                </span>
                <h3 className="font-headline-lg text-headline-lg-mobile uppercase tracking-tighter text-primary sm:text-headline-lg">
                  {t("home.newsletterTitle")}
                </h3>
                <p className="font-body-editorial text-body-editorial text-text-muted">
                  {t("home.newsletterSub")}
                </p>
              </div>
              <div className="lg:col-span-6">
                <form
                  className="flex flex-col gap-unit-sm"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSubscribed(true);
                    e.currentTarget.reset();
                    window.setTimeout(() => setSubscribed(false), 4000);
                  }}
                >
                  <div className="flex flex-col gap-unit-xs sm:flex-row">
                    <input
                      type="email"
                      required
                      placeholder={t("home.newsletterPlaceholder")}
                      className="h-12 flex-grow bg-surface-canvas px-unit-md font-mono-technical text-mono-technical uppercase text-primary shadow-inner placeholder:text-text-muted focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="press focus-kill h-12 shrink-0 bg-border-dark px-unit-xl font-label-caps text-label-caps uppercase text-surface-paper transition-all hover:bg-accent-crimson"
                    >
                      {t("home.newsletterCta")}
                    </button>
                  </div>
                  <div className="flex items-center justify-between pt-unit-2xs font-label-caps-sm text-label-caps-sm uppercase text-text-muted">
                    <span>{t("home.newsletterNote2")}</span>
                    <span className="font-mono-technical text-status-cod">
                      {t("home.newsletterNote")}
                    </span>
                  </div>
                  {subscribed ? (
                    <p className="pt-unit-xs font-mono-technical text-label-caps text-status-cod">
                      {t("home.newsletterOk")}
                    </p>
                  ) : null}
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ LATEST IN THE CATALOGUE ============ */}
      <section className="w-full bg-surface-paper py-unit-3xl">
        <div className={sectionPad}>
          <div className="flex flex-col justify-between gap-unit-sm pb-unit-lg md:flex-row md:items-end">
            <div>
              <span className="font-label-caps text-label-caps uppercase tracking-widest text-accent-crimson">
                {t("home.dropArchive")}
              </span>
              <h2 className="font-headline-lg text-headline-lg uppercase tracking-tighter text-primary">
                {t("home.latest")}
              </h2>
            </div>
            <Link
              href="/category/all"
              className="press focus-kill inline-flex h-12 items-center justify-center bg-border-dark px-unit-xl font-label-caps text-label-caps uppercase text-surface-canvas transition-all duration-150 hover:bg-primary"
            >
              {t("home.viewAll")}
            </Link>
          </div>
          <ProductGrid items={PRODUCTS} initial={12} step={8} cols={4} />
        </div>
      </section>
    </div>
  );
}

function CosmosCard({
  product: p,
  wide,
  offset,
}: {
  product: ReturnType<typeof getProduct> & { id: string };
  wide: boolean;
  offset?: boolean;
}) {
  const { t } = useLang();
  const { has, toggle } = useWishlist();
  if (!p) return null;
  const onSale = typeof p.originalPrice === "number";
  const pct = onSale
    ? Math.round(((p.originalPrice! - p.price) / p.originalPrice!) * 100)
    : 0;

  return (
    <article
      className={`group flex flex-col justify-between bg-surface-paper p-unit-sm shadow-sm ${
        wide ? "lg:col-span-6" : "lg:col-span-4"
      } ${offset ? "lg:-mt-8" : ""}`}
    >
      <div
        className={`relative overflow-hidden bg-surface-container-highest ${
          wide ? "aspect-[16/10]" : "aspect-[3/4]"
        }`}
      >
        <Link
          href={`/product/${p.id}`}
          aria-label={p.name}
          className="focus-kill absolute inset-0 block"
        >
          <Image
            src={p.imageUrls[0]}
            alt={p.name}
            fill
            sizes="(min-width:1024px) 33vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
        <div className="absolute left-2 top-2 flex gap-1">
          {p.promo ? (
            <span className="bg-accent-crimson px-1.5 py-0.5 font-label-caps-sm text-label-caps-sm uppercase text-surface-canvas">
              {t(promoLabelKey(p.promo))}
            </span>
          ) : onSale ? (
            <span className="bg-border-dark px-1.5 py-0.5 font-label-caps-sm text-label-caps-sm uppercase text-surface-canvas">
              −{pct}%
            </span>
          ) : (
            <span className="bg-border-dark px-1.5 py-0.5 font-label-caps-sm text-label-caps-sm uppercase text-surface-canvas">
              {t("home.cod")}
            </span>
          )}
        </div>
        <WishlistButton
          active={has(p.id)}
          label={t("wishlist.toggle")}
          onClick={() => toggle(p.id)}
          className="absolute right-2 top-2"
        />
      </div>

      <div className="flex flex-col gap-unit-2xs pt-unit-sm">
        <div className="flex items-center justify-between font-label-caps-sm text-label-caps-sm uppercase text-text-muted">
          <span>{t("home.hub")}</span>
          <span className="font-mono-technical font-bold text-primary">
            {formatPrice(p.price)}
          </span>
        </div>
        <Link href={`/product/${p.id}`} className="focus-kill">
          <h4 className="truncate font-body-editorial text-body-editorial font-bold text-primary">
            {p.name}
          </h4>
        </Link>
        <div className="flex items-center gap-unit-xs pt-unit-2xs font-mono-technical text-label-caps-sm text-text-muted">
          {p.sizes.slice(0, 3).map((s) => (
            <span key={s} className="bg-surface-canvas px-1.5 py-0.5">
              {s}
            </span>
          ))}
          <span className="ml-auto shrink-0 text-status-cod">
            {t("home.codDelivery")}
          </span>
        </div>
      </div>
    </article>
  );
}

function Pillar({
  kicker,
  tone,
  icon,
  title,
  body,
  note,
}: {
  kicker: string;
  tone: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  note: string;
}) {
  return (
    <div className="flex flex-col gap-unit-md bg-surface-charcoal p-unit-xl shadow-md">
      <div className="flex items-center justify-between">
        <span className={`font-mono-technical text-mono-technical font-bold ${tone}`}>
          {kicker}
        </span>
        {icon}
      </div>
      <h3 className="font-headline-sm text-headline-sm uppercase text-surface-paper">
        {title}
      </h3>
      <p className="font-body-utility text-body-utility text-surface-container-highest">
        {body}
      </p>
      <div className="pt-unit-sm font-label-caps-sm text-label-caps-sm uppercase text-surface-container-highest">
        {note}
      </div>
    </div>
  );
}