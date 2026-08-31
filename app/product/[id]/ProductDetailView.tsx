"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/lib/cart";
import { useLang, promoLabelKey } from "@/lib/i18n";
import { useWishlist } from "@/lib/wishlist";
import {
  asset,
  formatPrice,
  getRelated,
  getSeller,
  placeholder,
  type Product,
} from "@/lib/mock";
import ProductGrid from "@/components/ProductGrid";
import { Button, SectionHeader, WishlistButton } from "@/components/ui";

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
    >
      <path d="M6 9 L12 15 L18 9" />
    </svg>
  );
}

export default function ProductDetailView({ product }: { product: Product }) {
  const { t } = useLang();
  const { add } = useCart();
  const { has, toggle: toggleWish } = useWishlist();
  const seller = getSeller(product.sellerId);

  const [selected, setSelected] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [hint, setHint] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});

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

  const related = useMemo(() => getRelated(product, 8), [product]);
  const originalPrice = product.originalPrice;
  const isSale = typeof originalPrice === "number";
  const off =
    isSale && originalPrice > product.price
      ? Math.round(((originalPrice - product.price) / originalPrice) * 100)
      : 0;

  const toggle = (key: string) =>
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleAdd = () => {
    if (!size) {
      setHint(true);
      return;
    }
    add(product.id, size, qty);
  };

  return (
    <div>
      <div className="grid gap-8 px-5 pt-6 sm:px-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
        {/* Gallery */}
        <div>
          <div className="flex flex-row-reverse gap-3 lg:gap-5">
            {/* Main product photo — slot ab-XX (cover). 4:5 matches the Nike source. */}
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-soft-cloud">
              <Image
                src={shots[selected]}
                alt={product.name}
                fill
                sizes="(min-width:1024px) 60vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="hidden w-20 flex-col gap-2 sm:flex">
              {shots.map((shot, i) => (
                <button
                  key={shot}
                  type="button"
                  onClick={() => setSelected(i)}
                  className={`press focus-kill relative aspect-square overflow-hidden rounded-lg bg-soft-cloud ${
                    selected === i
                      ? "outline outline-2 outline-ink"
                      : "opacity-80 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={shot}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 flex justify-center gap-2 sm:hidden">
            {shots.map((shot, i) => (
              <button
                key={`dot-${shot}`}
                type="button"
                onClick={() => setSelected(i)}
                aria-label={`thumb ${i + 1}`}
                className={`h-1 rounded-full transition-all ${
                  selected === i ? "w-6 bg-ink" : "w-2 bg-hairline"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Buy box */}
        <div className="pb-4">
          {seller && (
            <Link
              href={`/seller/${seller.id}`}
              className="text-sm font-medium uppercase text-mute transition-colors hover:text-ink"
            >
              {t("pdp.by", { seller: seller.name })}
            </Link>
          )}

          <h1 className="mt-2 text-[28px] font-medium tracking-tight text-ink sm:text-[32px]">
            {product.name}
          </h1>

          <div className="mt-3 flex items-center gap-3">
            <span
              className={`text-xl font-medium tabular-nums ${
                isSale ? "text-sale" : "text-ink"
              }`}
            >
              {formatPrice(product.price)}
            </span>
            {isSale && originalPrice && (
              <>
                <span className="text-base tabular-nums text-stone line-through">
                  {formatPrice(originalPrice)}
                </span>
                <span className="rounded-lg border border-sale px-2 py-0.5 text-xs font-medium tabular-nums text-sale">
                  −{off}%
                </span>
              </>
            )}
          </div>

          {product.promo && (
            <span className="mt-4 inline-block rounded-lg border border-hairline px-3 py-1 text-xs font-medium uppercase tracking-wide text-charcoal">
              {t(promoLabelKey(product.promo))}
            </span>
          )}

          <div className="mt-6">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium uppercase text-ink">
                {t("pdp.colorway")}
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              {product.swatches.map((c, i) => (
                <button
                  key={c}
                  type="button"
                  aria-label={t("pdp.swatch", { n: i + 1 })}
                  aria-pressed={selected === i}
                  onClick={() => setSelected(i)}
                  className={`press focus-kill h-7 w-7 rounded-sm border transition-opacity ${
                    selected === i
                      ? "border-ink outline outline-1 outline-ink outline-offset-2"
                      : "border-hairline hover:opacity-80"
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          <div className="mt-6">
            <span className="text-sm font-medium uppercase text-ink">
              {t("pdp.selectSize")}
            </span>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSize(s);
                    setHint(false);
                  }}
                  className={`press focus-kill h-11 min-w-12 rounded-lg border px-3 text-sm font-medium transition-colors ${
                    size === s
                      ? "border-ink bg-ink text-on-primary"
                      : "border-hairline bg-canvas text-ink hover:border-ink"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {hint && (
              <p className="mt-2 text-xs font-medium text-sale">
                {t("pdp.sizeHint")}
              </p>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <span className="text-sm font-medium uppercase text-ink">
              {t("pdp.quantity")}
            </span>
            <div className="flex h-10 items-center rounded-lg border border-hairline">
              <button
                type="button"
                aria-label="−"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="press focus-kill flex h-full w-10 items-center justify-center text-ink"
              >
                −
              </button>
              <span className="min-w-8 text-center text-sm tabular-nums">
                {qty}
              </span>
              <button
                type="button"
                aria-label="+"
                onClick={() => setQty((q) => Math.min(9, q + 1))}
                className="press focus-kill flex h-full w-10 items-center justify-center text-ink"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleAdd}
            >
              {t("pdp.addToCart")}
            </Button>
            <WishlistButton
              active={has(product.id)}
              label={t("wishlist.toggle")}
              onClick={() => toggleWish(product.id)}
              className="h-12 w-12"
            />
          </div>
          <p className="mt-3 text-center text-xs text-mute">
            {t("pdp.mockNote")}
          </p>

          {/* Disclosure rows */}
          <div className="mt-8 border-t border-hairline-soft">
            <Disclosure
              open={!!open["details"]}
              label={t("pdp.details")}
              onClick={() => toggle("details")}
            >
              <p className="text-sm leading-6 text-charcoal">
                {product.description}
              </p>
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-mute">
                {t("pdp.materials")}: {product.sizes.length} sizes
              </p>
            </Disclosure>
            <Disclosure
              open={!!open["shipping"]}
              label={t("pdp.shipping")}
              onClick={() => toggle("shipping")}
            >
              <p className="text-sm leading-6 text-charcoal">
                {t("pdp.shipText")}
              </p>
            </Disclosure>
            <Disclosure
              open={!!open["reviews"]}
              label={`${t("pdp.reviews")}·${product.reviews}`}
              onClick={() => toggle("reviews")}
            >
              <p className="text-sm leading-6 text-charcoal">
                {t("pdp.noReviews")}
              </p>
            </Disclosure>
          </div>

          {seller && (
            <p className="mt-4 text-[11px] uppercase tracking-wide text-stone">
              {t("pdp.soldBy")}{" "}
              <Link
                href={`/seller/${seller.id}`}
                className="font-medium text-ink underline underline-offset-2"
              >
                {seller.name}
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* Complete the Look */}
      <section className="flex flex-col gap-6 py-12">
        <SectionHeader
          title={t("pdp.related")}
          viewAllHref={`/category/${product.category.toLowerCase()}`}
          viewAllLabel={t("home.viewAll")}
        />
        <div className="px-2 sm:px-6">
          <ProductGrid items={related} initial={8} step={0} cols={4} />
        </div>
      </section>
    </div>
  );
}

function Disclosure({
  open,
  label,
  onClick,
  children,
}: {
  open: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-hairline-soft">
      <button
        type="button"
        onClick={onClick}
        className="focus-kill flex w-full items-center justify-between py-4 text-sm font-medium text-ink"
      >
        {label}
        <ChevronDown open={open} />
      </button>
      <div
        className={`grid transition-all duration-300 ${
          open ? "grid-rows-[1fr] pb-5 opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}