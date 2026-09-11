"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useCart } from "@/lib/cart";
import {
  categoryLabelKey,
  genderLabelKey,
  localizedProductText,
  promoLabelKey,
  subcategoryLabelKey,
  useLang,
} from "@/lib/i18n";
import { useWishlist } from "@/lib/wishlist";
import {
  asset,
  formatPrice,
  getRelated,
  getSeller,
  placeholder,
  type Product,
} from "@/lib/mock";
import { wilayaName } from "@/lib/wilayas";
import ProductGrid from "@/components/ProductGrid";
import {
  BagIcon,
  ChevronDownIcon,
  CloseIcon,
  HeartGlyph,
  PaymentsIcon,
  PersonIcon,
  ReturnsIcon,
  SearchIcon,
  ShieldIcon,
  StarIcon,
  StoreIcon,
  TruckIcon,
  VerifiedIcon,
} from "@/components/ui";

/** Editorial atelier codes — used for stamp & vendor monogram. */
const SELLER_ATELIER: Record<string, string> = {
  s1: "16-HYD",
  s2: "24-BRK",
  s3: "31-ORN",
  s4: "25-CST",
  s5: "09-JSN",
};

const SWATCH_NAMES = ["Noir Absolu", "Craie", "Ardoise", "Ivoire", "Bordeaux"];

/** Pseudo deterministic per-size stock (0 = sold out). */
const stockOf = (index: number, total: number) => {
  const stock = (index * 3 + 1) % 5;
  if (total === 1 && stock === 0) return 2;
  return stock;
};

const WILAYA_CALC = ["16", "09", "42", "31", "25", "23", "30", "11"];

const rateKeyFor = (code: string) =>
  code === "16" || code === "09" || code === "42"
    ? ("pdp.rate24" as const)
    : code === "11" || code === "30"
      ? ("pdp.rateSouth" as const)
      : ("pdp.rate48" as const);

export default function ProductDetailView({ product }: { product: Product }) {
  const { t, lang } = useLang();
  const { add } = useCart();
  const { has, toggle: toggleWish } = useWishlist();
  const seller = getSeller(product.sellerId);
  const atelier = seller ? (SELLER_ATELIER[seller.id] ?? "99-XXX") : "99-XXX";
  const code = atelier.split("-")[0];

  const [selected, setSelected] = useState(0);
  const [size, setSize] = useState<string | null>(
    product.sizes[Math.floor(product.sizes.length / 2)] ?? product.sizes[0] ?? null
  );
  const [hint, setHint] = useState(false);
  const [added, setAdded] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [wilaya, setWilaya] = useState(WILAYA_CALC[0]);
  const [sizeModal, setSizeModal] = useState(false);
  const addTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // PDP gallery "shots".
  // - Shots 0-2 come from the product's own imageUrls (slots "ab-XX",
  //   "ab-XX-2", "ab-XX-3"), so the cover matches the cards & cart, and
  //   setting one line in IMAGE_MAP (lib/mock.ts) swaps them everywhere.
  // - Shot 3 is an extra angle with its own optional slot "ab-XX-4".
  // - Raw/Nike slots share one image per product, so dedupe collapses the
  //   gallery to a single clean shot instead of 4 identical thumbnails.
  const shots = useMemo(
    () =>
      [
        ...product.imageUrls.slice(0, 3),
        asset(
          `${product.id}-4`,
          placeholder(`thing-${product.id}-d`, 1200, 1200)
        ),
      ].filter((src, i, all) => all.indexOf(src) === i),
    [product]
  );

  const related = useMemo(() => getRelated(product, 6), [product]);

  const originalPrice = product.originalPrice;
  const isSale = typeof originalPrice === "number";
  const off =
    isSale && originalPrice > product.price
      ? Math.round(((originalPrice - product.price) / originalPrice) * 100)
      : 0;

  const selectedIndex = size ? product.sizes.indexOf(size) : -1;
  const selectedStock = selectedIndex >= 0 ? stockOf(selectedIndex, product.sizes.length) : 0;
  const defaultIdx = Math.floor(product.sizes.length / 2);
  const recommendedSize = product.sizes[defaultIdx] ?? product.sizes[0];

  const description = localizedProductText(lang, product.description, product.descriptionFr);

  useEffect(() => {
    return () => {
      if (addTimer.current) clearTimeout(addTimer.current);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = sizeModal ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSizeModal(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [sizeModal]);

  const toggle = (key: string) =>
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleAdd = () => {
    if (!size) {
      setHint(true);
      return;
    }
    add(product.id, size, 1);
    setAdded(true);
    if (addTimer.current) clearTimeout(addTimer.current);
    addTimer.current = setTimeout(() => setAdded(false), 2500);
  };

  const sizeCells = (idx: number) => ({
    shoulders: 50 + idx * 4,
    chest: 118 + idx * 6,
    length: 76 + idx * 2,
    sleeves: 62 + idx * 1.5,
  });

  return (
    <div>
      {/* Breadcrumbs & Archival Index Bar */}
      <section className="w-full bg-surface-paper px-margin-mobile lg:px-margin-desktop py-unit-sm">
        <div className="w-full flex flex-wrap items-center justify-between gap-unit-sm">
          <div className="flex items-center gap-unit-xs font-label-caps-sm text-label-caps-sm text-text-muted uppercase whitespace-nowrap overflow-x-auto">
            <Link href="/" className="hover:text-primary transition-colors">
              {t("pdp.crumbArchive")}
            </Link>
            <span>/</span>
            <Link
              href={`/category/${product.category.toLowerCase()}`}
              className="hover:text-primary transition-colors"
            >
              {t(categoryLabelKey(product.category.toLowerCase()))}
            </Link>
            <span>/</span>
            <Link
              href={`/category/${product.category.toLowerCase()}?sub=${product.subcategory}`}
              className="hover:text-primary transition-colors"
            >
              {t(subcategoryLabelKey(product.subcategory))}
            </Link>
            <span>/</span>
            <span className="text-primary font-bold">
              #ABY-{product.id.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-unit-md font-mono-technical text-mono-technical">
            <span className="inline-flex items-center gap-1 text-status-cod">
              <span className="w-1.5 h-1.5 bg-status-cod rounded-full"></span>
              <span>{t("pdp.availableHub")}</span>
            </span>
            <span className="text-text-muted hidden sm:inline">|</span>
            <span className="text-text-muted uppercase hidden sm:inline">
              {t("pdp.series", { n: "18 / 25" })}
            </span>
          </div>
        </div>
      </section>

      {/* Main PDP split */}
      <section className="w-full px-margin-mobile lg:px-margin-desktop py-unit-lg lg:py-unit-xl">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-unit-lg xl:gap-unit-xl items-start">
          {/* LEFT COLUMN: gallery & editorial storytelling */}
          <div className="w-full lg:col-span-7 flex flex-col gap-unit-xl">
            <div className="w-full flex flex-col-reverse md:flex-row gap-unit-md items-start">
              {/* Vertical thumbnail rail */}
              <div className="w-full md:w-20 flex md:flex-col gap-unit-xs overflow-x-auto md:overflow-visible shrink-0 select-none">
                {shots.map((shot, i) => (
                  <button
                    key={shot}
                    type="button"
                    onClick={() => setSelected(i)}
                    className={`group relative w-16 h-20 md:w-20 md:h-28 bg-surface-container overflow-hidden transition-all shrink-0 ${
                      selected === i
                        ? "ring-2 ring-primary"
                        : "ring-1 ring-border-rule opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={shot}
                      alt=""
                      fill
                      sizes="96px"
                      className="w-full h-full object-cover object-center group-hover:opacity-90"
                    />
                    <span className="absolute bottom-1 right-1 font-mono-technical text-[9px] bg-primary text-on-primary px-1">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </button>
                ))}
              </div>

              {/* Main hero canvas */}
              <div className="relative w-full aspect-[3/4] bg-surface-paper overflow-hidden select-none">
                <Image
                  src={shots[selected]}
                  alt={product.name}
                  fill
                  sizes="(min-width:1024px) 58vw, 100vw"
                  className="object-cover object-center"
                />

                {/* Authentic verification stamp */}
                <div className="absolute top-unit-md left-unit-md bg-surface-paper/95 backdrop-blur-sm p-unit-sm shadow-md flex items-center gap-unit-sm">
                  <div className="w-7 h-7 bg-primary flex items-center justify-center text-on-primary">
                    <VerifiedIcon size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-caps-sm text-label-caps-sm text-primary uppercase">
                      {t("pdp.certified")}
                    </span>
                    <span className="font-mono-technical text-[10px] text-text-muted">
                      ATELIER {code} · {t("pdp.lotTag")}
                    </span>
                  </div>
                </div>

                {/* Zoom & inspect trigger */}
                <div className="absolute bottom-unit-md right-unit-md bg-surface-charcoal text-on-primary px-unit-sm py-1 flex items-center gap-unit-xs font-mono-technical text-mono-technical shadow-sm">
                  <SearchIcon className="h-[14px] w-[14px]" />
                  <span className="uppercase">{t("pdp.macro")}</span>
                </div>

                {/* Badge overlays */}
                <div className="absolute top-unit-md right-unit-md flex flex-col gap-1 items-end">
                  {isSale && off > 0 ? (
                    <span className="bg-accent-crimson text-on-error font-label-caps-sm text-label-caps-sm px-2 py-0.5 uppercase tracking-wider">
                      −{off}%
                    </span>
                  ) : product.promo ? (
                    <span className="bg-accent-crimson text-on-error font-label-caps-sm text-label-caps-sm px-2 py-0.5 uppercase tracking-wider">
                      {t(promoLabelKey(product.promo))}
                    </span>
                  ) : (
                    <span className="bg-accent-crimson text-on-error font-label-caps-sm text-label-caps-sm px-2 py-0.5 uppercase tracking-wider">
                      {t("pdp.badgeDefault")}
                    </span>
                  )}
                  <span className="bg-primary text-on-primary font-mono-technical text-mono-technical px-2 py-0.5 uppercase">
                    SERIES {String(product.sizes.length).padStart(2, "0")}
                  </span>
                </div>
              </div>
            </div>

            {/* Materials & archival provenance grid */}
            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-unit-md bg-surface-paper p-unit-lg shadow-sm">
              <div className="flex flex-col gap-1">
                <span className="font-label-caps-sm text-label-caps-sm text-text-muted uppercase">
                  {t("pdp.materials")}
                </span>
                <span className="font-mono-technical text-body-utility text-primary font-bold uppercase">
                  {t(subcategoryLabelKey(product.subcategory))}
                </span>
                <p className="font-body-utility text-text-muted text-[12px] leading-relaxed">
                  {description}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-label-caps-sm text-label-caps-sm text-text-muted uppercase">
                  {t("pdp.cutLabel")}
                </span>
                <span className="font-mono-technical text-body-utility text-primary font-bold uppercase">
                  {product.sizes.join(" / ")} · {t(genderLabelKey(product.gender))}
                </span>
                <p className="font-body-utility text-text-muted text-[12px] leading-relaxed">
                  {t("pdp.cutNote")}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-label-caps-sm text-label-caps-sm text-text-muted uppercase">
                  {t("pdp.originLabel")}
                </span>
                <span className="font-mono-technical text-body-utility text-primary font-bold uppercase">
                  {seller ? seller.name : product.sellerName}
                </span>
                <p className="font-body-utility text-text-muted text-[12px] leading-relaxed">
                  {t("pdp.originNote")}
                </p>
              </div>
            </div>

            {/* Editorial lookbook grid details */}
            {shots.length >= 3 ? (
              <div className="w-full flex flex-col gap-unit-md">
                <div className="flex items-center justify-between pb-unit-xs">
                  <span className="font-label-caps text-label-caps uppercase text-primary tracking-widest">
                    {t("pdp.figKicker")}
                  </span>
                  <span className="font-mono-technical text-mono-technical text-text-muted">
                    {t("pdp.figRef")}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-unit-md">
                  <figure className="relative aspect-[4/5] bg-surface-container overflow-hidden group">
                    <Image
                      src={shots[1]}
                      alt=""
                      fill
                      sizes="(min-width:640px) 40vw, 100vw"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <figcaption className="absolute bottom-0 inset-x-0 p-unit-md bg-gradient-to-t from-primary/80 to-transparent text-on-primary">
                      <span className="font-mono-technical text-label-caps-sm uppercase">
                        {t("pdp.macro")}
                      </span>
                      <p className="font-body-utility text-[12px] text-surface-container-highest">
                        {t("pdp.matNote")}
                      </p>
                    </figcaption>
                  </figure>
                  <figure className="relative aspect-[4/5] bg-surface-container overflow-hidden group">
                    <Image
                      src={shots[2]}
                      alt=""
                      fill
                      sizes="(min-width:640px) 40vw, 100vw"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <figcaption className="absolute bottom-0 inset-x-0 p-unit-md bg-gradient-to-t from-primary/80 to-transparent text-on-primary">
                      <span className="font-mono-technical text-label-caps-sm uppercase">
                        {t("pdp.originLabel")}
                      </span>
                      <p className="font-body-utility text-[12px] text-surface-container-highest">
                        {t("pdp.originNote")}
                      </p>
                    </figcaption>
                  </figure>
                </div>
              </div>
            ) : null}
          </div>

          {/* RIGHT COLUMN: sticky purchase engine */}
          <div className="w-full lg:col-span-5 lg:sticky lg:top-28 flex flex-col gap-unit-lg">
            <div className="w-full bg-surface-paper p-unit-lg xl:p-unit-xl shadow-md flex flex-col gap-unit-lg">
              {/* Boutique attribution badge */}
              <div className="w-full flex items-center justify-between pb-unit-sm bg-surface-container-low p-unit-sm">
                <Link
                  href={`/seller/${seller?.id ?? ""}`}
                  className="flex items-center gap-unit-sm"
                >
                  <div className="w-10 h-10 bg-primary text-on-primary flex items-center justify-center font-display-hero text-headline-sm">
                    {code}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-label-caps text-label-caps text-primary uppercase">
                        {seller ? seller.name : product.sellerName}
                      </span>
                      <VerifiedIcon
                        size={15}
                        filled
                        className="text-status-cod"
                        />
                    </div>
                    <span className="font-mono-technical text-[10px] text-text-muted uppercase">
                      {seller ? seller.location : `ATELIER {code}`}
                    </span>
                  </div>
                </Link>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1">
                    <StarIcon size={14} filled className="text-amber-500" />
                    <span className="font-mono-technical text-mono-technical font-bold text-primary">
                      {(
                        4.4 +
                        ((product.reviews * 7) % 6) / 10
                      ).toFixed(1)}
                    </span>
                    <span className="font-mono-technical text-[10px] text-text-muted">
                      ({product.reviews})
                    </span>
                  </div>
                  <span className="font-label-caps-sm text-[8px] text-status-cod uppercase font-bold tracking-wider">
                    {t("pdp.partner")}
                  </span>
                </div>
              </div>

              {/* Title, reference & price */}
              <div className="flex flex-col gap-unit-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono-technical text-mono-technical text-text-muted uppercase">
                    REF #ABY-{product.id.toUpperCase()}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-surface-container px-2 py-0.5 font-label-caps-sm text-label-caps-sm text-primary uppercase">
                    <span className="w-1.5 h-1.5 bg-accent-crimson rounded-full animate-pulse"></span>
                    <span>{t("pdp.demand")}</span>
                  </span>
                </div>
                <h1 className="font-headline-lg text-headline-lg text-primary uppercase tracking-tight leading-none mt-1">
                  {product.name}
                </h1>
                <div className="flex items-baseline gap-unit-sm mt-unit-xs">
                  <span className="font-display-hero text-headline-lg text-primary tracking-tight">
                    {formatPrice(product.price)}
                  </span>
                  <span className="font-body-utility text-text-muted text-[12px]">
                    TTC
                  </span>
                  {isSale && originalPrice ? (
                    <span className="font-mono-technical text-mono-technical text-text-muted line-through">
                      {formatPrice(originalPrice)}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-1 text-status-cod font-mono-technical text-mono-technical mt-0.5">
                  <PaymentsIcon size={15} className="text-status-cod" />
                  <span>{t("pdp.codLine")}</span>
                </div>
              </div>

              {/* Color swatches */}
              <div className="flex flex-col gap-unit-xs">
                <div className="flex justify-between items-center">
                  <span className="font-label-caps text-label-caps uppercase text-primary">
                    {t("pdp.stockCol")}{" "}
                    <span className="text-text-muted font-normal">
                      {SWATCH_NAMES[selected] ?? `COL ${selected + 1}`}
                    </span>
                  </span>
                  <span className="font-mono-technical text-[10px] text-text-muted">
                    {t("pdp.dye")}
                  </span>
                </div>
                <div className="flex items-center gap-unit-sm pt-1 flex-wrap">
                  {product.swatches.map((c, i) => (
                    <button
                      key={`${c}-${i}`}
                      type="button"
                      onClick={() => setSelected(i)}
                      aria-pressed={selected === i}
                      className={`group flex items-center gap-2 p-1.5 bg-surface-container transition-all ${
                        selected === i
                          ? "ring-2 ring-primary"
                          : "ring-1 ring-border-rule hover:ring-primary"
                      }`}
                    >
                      <span
                        className="w-6 h-6 block"
                        style={{ background: c }}
                      ></span>
                      <span
                        className={`font-mono-technical text-[11px] pr-1 uppercase ${
                          selected === i
                            ? "text-primary"
                            : "text-text-muted group-hover:text-primary"
                        }`}
                      >
                        {SWATCH_NAMES[i] ?? `COL ${i + 1}`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Size selector & inventory */}
              <div className="flex flex-col gap-unit-xs">
                <div className="flex justify-between items-center">
                  <span className="font-label-caps text-label-caps uppercase text-primary">
                    {t("pdp.selectSize")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSizeModal(true)}
                    className="font-label-caps-sm text-label-caps-sm text-primary uppercase underline hover:text-accent-crimson transition-colors flex items-center gap-0.5 press focus-kill py-unit-sm"
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      aria-hidden="true"
                    >
                      <path d="M3 7 L21 7 M7 4 V10 M12 4 V10 M17 4 V10" />
                      <path d="M3 17 L21 17 M7 14 V20 M12 14 V20 M17 14 V20" />
                    </svg>
                    <span>{t("pdp.sizeGuide")}</span>
                  </button>
                </div>
                <div
                  className="grid gap-unit-xs pt-1"
                  style={{
                    gridTemplateColumns: `repeat(${Math.min(
                      4,
                      product.sizes.length
                    )}, minmax(0, 1fr))`,
                  }}
                >
                  {product.sizes.map((s, i) => {
                    const stock = stockOf(i, product.sizes.length);
                    const active = size === s;
                    const soldOut = stock === 0;
                    return (
                      <button
                        key={s}
                        type="button"
                        disabled={soldOut}
                        onClick={() => {
                          setSize(s);
                          setHint(false);
                        }}
                        className={`flex flex-col items-center justify-center h-14 transition-all ${
                          soldOut
                            ? "bg-surface-container-high opacity-40 cursor-not-allowed"
                            : active
                              ? "bg-primary text-on-primary ring-2 ring-primary"
                              : "bg-surface-container ring-1 ring-border-rule hover:ring-primary"
                        }`}
                      >
                        <span
                          className={`font-headline-sm text-headline-sm uppercase ${
                            soldOut
                              ? "text-text-muted line-through"
                              : active
                                ? "text-on-primary"
                                : "text-primary"
                          }`}
                        >
                          {s}
                        </span>
                        <span
                          className={`font-mono-technical text-[9px] ${
                            soldOut
                              ? "text-text-muted uppercase"
                              : stock === 1
                                ? "text-accent-crimson font-bold"
                                : active
                                  ? "text-surface-container-highest"
                                  : "text-text-muted"
                          }`}
                        >
                          {soldOut
                            ? t("pdp.soldOut")
                            : stock === 1
                              ? t("pdp.sizeLeft", { n: 1 })
                              : t("pdp.stockCount", { n: stock })}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {hint ? (
                  <p className="mt-1 text-xs font-medium text-accent-crimson">
                    {t("pdp.sizeHint")}
                  </p>
                ) : null}
                <div className="flex items-center justify-between text-mono-technical font-mono-technical bg-surface-container-low px-unit-sm py-1.5 mt-1">
                  <span className="text-text-muted uppercase">
                    {t("pdp.stockAt")}
                  </span>
                  <span
                    className={`font-bold uppercase ${
                      selectedStock === 0 || selectedIndex < 0
                        ? "text-text-muted"
                        : selectedStock === 1
                          ? "text-accent-crimson"
                          : "text-status-cod"
                    }`}
                  >
                    {selectedIndex < 0 || selectedStock === 0
                      ? t("pdp.soldOut")
                      : selectedStock === 1
                        ? t("pdp.stockLast", { s: size ?? "" })
                        : t("pdp.stockLeft", { n: selectedStock, s: size ?? "" })}
                  </span>
                </div>
              </div>

              {/* Primary actions: add to bag + wishlist */}
              <div className="flex flex-col gap-unit-xs pt-unit-xs">
                <button
                  type="button"
                  onClick={handleAdd}
                  className={`w-full h-12 text-on-primary font-headline-sm text-headline-sm uppercase tracking-wider flex items-center justify-center gap-unit-sm shadow-md active:scale-[0.99] transition-all ${
                    added ? "bg-status-cod" : "bg-primary hover:bg-surface-charcoal"
                  }`}
                >
                  <BagIcon />
                  <span>
                    {added
                      ? t("pdp.added", { n: size ?? "" })
                      : `${t("pdp.addToCart")} · ${formatPrice(product.price)}`}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleWish(product.id)}
                  className="w-full h-11 bg-transparent text-primary hover:bg-surface-container ring-1 ring-primary font-label-caps text-label-caps uppercase flex items-center justify-center gap-unit-xs transition-colors"
                >
                  <HeartGlyph
                    size={18}
                    filled={has(product.id)}
                    className={has(product.id) ? "text-accent-crimson" : ""}
                  />
                  <span>
                    {has(product.id)
                      ? t("pdp.savedFavs")
                      : t("pdp.saveFavs")}
                  </span>
                </button>
                <p className="mt-1 text-center text-[11px] font-body-utility text-text-muted">
                  {t("pdp.mockNote")}
                </p>
              </div>

              {/* Wilaya destination logistics preview */}
              <div className="flex flex-col gap-unit-xs pt-unit-xs bg-surface-container p-unit-md">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps-sm text-label-caps-sm uppercase text-text-muted">
                    {t("pdp.shippingKicker")}
                  </span>
                  <span className="font-mono-technical text-[10px] text-primary">
                    {t("pdp.shippingSub")}
                  </span>
                </div>
                <div className="flex gap-unit-xs">
                  <select
                    value={wilaya}
                    onChange={(e) => setWilaya(e.target.value)}
                    className="w-full h-10 px-unit-sm bg-surface-paper text-primary font-mono-technical text-mono-technical focus:outline-none ring-1 ring-border-rule"
                  >
                    {WILAYA_CALC.map((codeNum) => (
                      <option key={codeNum} value={codeNum}>
                        {codeNum} - {wilayaName(Number(codeNum))}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-between items-center pt-1 font-mono-technical text-mono-technical">
                  <span className="text-text-muted">
                    {t("pdp.shippingLabel")}
                  </span>
                  <span
                    className={`font-bold ${
                      rateKeyFor(wilaya) === "pdp.rateSouth"
                        ? "text-primary"
                        : "text-status-cod"
                    }`}
                  >
                    {t(rateKeyFor(wilaya))}
                  </span>
                </div>
              </div>

              {/* Guarantees accordions */}
              <div className="flex flex-col divide-y divide-border-rule">
                <Disclosure
                  open={!!open["ship"]}
                  onClick={() => toggle("ship")}
                  icon={<TruckIcon size={18} className="text-primary" />}
                  label={t("pdp.shippingTitle")}
                >
                  <p className="font-body-utility text-text-muted text-[13px] leading-relaxed">
                    {t("pdp.shipText")}
                  </p>
                </Disclosure>
                <Disclosure
                  open={!!open["cod"]}
                  onClick={() => toggle("cod")}
                  icon={
                    <PaymentsIcon size={18} className="text-status-cod" />
                  }
                  label={t("pdp.codTitle")}
                >
                  <div className="bg-surface-container-low p-unit-sm">
                    <span className="font-label-caps-sm text-label-caps-sm text-status-cod uppercase font-bold block mb-1">
                      {t("pdp.codProtocolTitle")}
                    </span>
                    <p className="font-body-utility text-text-muted text-[13px] leading-relaxed">
                      {t("pdp.codBody")}
                    </p>
                  </div>
                  <p className="text-[11px] text-text-muted font-mono-technical mt-1">
                    {t("pdp.codReceipt")}
                  </p>
                </Disclosure>
                <Disclosure
                  open={!!open["returns"]}
                  onClick={() => toggle("returns")}
                  icon={<ReturnsIcon size={18} className="text-primary" />}
                  label={t("pdp.returnsTitle")}
                >
                  <p className="font-body-utility text-text-muted text-[13px] leading-relaxed">
                    {t("pdp.returnsBody")}
                  </p>
                  <p className="font-body-utility text-text-muted text-[13px] leading-relaxed">
                    <strong className="text-primary font-semibold">
                      {t("pdp.returnOptionA")}
                    </strong>{" "}
                    {t("pdp.returnA")}
                    {seller ? (
                      <span className="text-primary font-mono-technical">
                        {" "}
                        {seller.name}, {seller.location}
                      </span>
                    ) : null}
                  </p>
                  <p className="font-body-utility text-text-muted text-[13px] leading-relaxed">
                    <strong className="text-primary font-semibold">
                      {t("pdp.returnOptionB")}
                    </strong>{" "}
                    {t("pdp.returnB")}
                  </p>
                </Disclosure>
              </div>

              {/* Trust badges footnote */}
              <div className="grid grid-cols-2 gap-unit-xs pt-unit-sm border-t border-border-rule font-mono-technical text-[10px] text-text-muted uppercase">
                <div className="flex items-center gap-1.5">
                  <ShieldIcon size={14} className="text-primary" />
                  <span>{t("pdp.trustAuth")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <StoreIcon size={14} className="text-primary" />
                  <span>{t("pdp.trustInvoice")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curated with this piece */}
      <section className="w-full px-margin-mobile lg:px-margin-desktop py-unit-3xl bg-surface-paper shadow-sm mt-unit-2xl">
        <div className="w-full flex flex-col gap-unit-xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-unit-sm pb-unit-sm border-b border-border-rule">
            <div className="flex flex-col">
              <span className="font-label-caps-sm text-label-caps-sm text-accent-crimson uppercase tracking-widest">
                {t("pdp.relatedKicker")}
              </span>
              <h2 className="font-headline-lg text-headline-lg text-primary uppercase tracking-tight">
                {t("pdp.related")}
              </h2>
            </div>
            <p className="font-body-utility text-text-muted max-w-md text-[13px]">
              {t("pdp.relatedSub")}
            </p>
          </div>
          <ProductGrid
            items={related}
            initial={6}
            step={0}
            cols={3}
            loadMore={false}
          />
        </div>
      </section>

      {/* Size guide modal */}
      {sizeModal ? (
        <div
          className="fixed inset-0 z-50 bg-surface-charcoal/80 flex items-center justify-center p-unit-md"
          onClick={() => setSizeModal(false)}
        >
          <div
            className="bg-surface-paper max-w-2xl w-full p-unit-xl shadow-2xl flex flex-col gap-unit-lg max-h-[calc(100dvh-2rem)] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border-rule pb-unit-sm">
              <div className="flex flex-col">
                <span className="font-label-caps-sm text-label-caps-sm text-text-muted uppercase">
                  {t("pdp.sizeModalKicker")}
                </span>
                <h3 className="font-headline-lg text-headline-sm text-primary uppercase">
                  {t("pdp.sizeModalTitle")}
                </h3>
              </div>
              <button
                type="button"
                aria-label="close"
                onClick={() => setSizeModal(false)}
                className="w-11 h-11 flex items-center justify-center text-primary hover:bg-surface-canvas transition-colors press focus-kill"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="font-body-editorial text-body-editorial text-text-muted">
              {t("pdp.sizeModalBody")}
            </p>
            <div className="w-full overflow-x-auto">
              <table className="w-full font-mono-technical text-mono-technical text-left border-collapse">
                <thead>
                  <tr className="bg-surface-canvas border-b border-border-rule text-primary font-bold">
                    <th className="py-2.5 px-3 uppercase">
                      {t("pdp.th.size")}
                    </th>
                    <th className="py-2.5 px-3 uppercase">
                      {t("pdp.th.shoulders")}
                    </th>
                    <th className="py-2.5 px-3 uppercase">
                      {t("pdp.th.chest")}
                    </th>
                    <th className="py-2.5 px-3 uppercase">
                      {t("pdp.th.length")}
                    </th>
                    <th className="py-2.5 px-3 uppercase">
                      {t("pdp.th.sleeves")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-rule text-on-surface">
                  {product.sizes.map((s, i) => {
                    const m = sizeCells(i);
                    const recommended = s === recommendedSize;
                    return (
                      <tr
                        key={s}
                        className={
                          recommended ? "bg-surface-container-low" : ""
                        }
                      >
                        <td className="py-2 px-3 font-bold">
                          <span className="inline-flex items-center gap-1.5">
                            <span className={recommended ? "" : ""}>{s}</span>
                            {recommended ? (
                              <span className="text-[9px] bg-primary text-on-primary px-1 uppercase">
                                {t("pdp.recommended")}
                              </span>
                            ) : null}
                          </span>
                        </td>
                        <td className="py-2 px-3">{m.shoulders}</td>
                        <td className="py-2 px-3">{m.chest}</td>
                        <td className="py-2 px-3">{m.length}</td>
                        <td className="py-2 px-3">{m.sleeves}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-unit-md bg-surface-container p-unit-md">
              <div className="flex items-center gap-unit-sm">
                <PersonIcon size={24} className="text-primary" />
                <div className="flex flex-col">
                  <span className="font-label-caps text-label-caps text-primary uppercase">
                    {t("pdp.sizeHelpTitle")}
                  </span>
                  <span className="font-body-utility text-[12px] text-text-muted">
                    {t("pdp.sizeHelpBody")}
                  </span>
                </div>
              </div>
              <Link
                href={`/seller/${seller?.id ?? ""}`}
                className="px-unit-md py-unit-xs bg-primary text-on-primary font-mono-technical text-mono-technical uppercase hover:bg-surface-charcoal transition-colors"
              >
                {t("pdp.sizeCall")}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Disclosure({
  open,
  onClick,
  icon,
  label,
  children,
}: {
  open: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="py-unit-sm">
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-unit-sm">
          {icon}
          <span className="font-label-caps text-label-caps uppercase text-primary group-hover:text-accent-crimson transition-colors">
            {label}
          </span>
        </div>
        <ChevronDownIcon
          className={`text-text-muted transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ${
          open
            ? "grid-rows-[1fr] pt-unit-sm opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden flex flex-col gap-unit-xs">
          {children}
        </div>
      </div>
    </div>
  );
}