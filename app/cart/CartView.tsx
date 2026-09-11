"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCart, type CartLine } from "@/lib/cart";
import { useLang } from "@/lib/i18n";
import { formatPrice, getProduct, getSeller } from "@/lib/mock";
import { deliveryFeeFor } from "@/lib/wilayas";
import CheckoutStepper from "@/components/CheckoutStepper";
import {
  PersonIcon,
  ShieldIcon,
  StoreIcon,
  TruckIcon,
  VerifiedIcon,
} from "@/components/ui";

function Stepper({
  qty,
  onInc,
  onDec,
}: {
  qty: number;
  onInc: () => void;
  onDec: () => void;
}) {
  const { t } = useLang();
  return (
    <div className="inline-flex items-center bg-surface-paper ring-1 ring-border-rule">
      <button
        type="button"
        onClick={onDec}
        aria-label={t("cart.dec")}
        className="flex h-11 w-11 items-center justify-center text-primary transition-colors hover:bg-surface-canvas"
      >
        −
      </button>
      <span className="w-8 text-center text-sm font-mono-technical tabular-nums text-primary">
        {qty}
      </span>
      <button
        type="button"
        onClick={onInc}
        aria-label={t("cart.inc")}
        className="flex h-11 w-11 items-center justify-center text-primary transition-colors hover:bg-surface-canvas"
      >
        +
      </button>
    </div>
  );
}

export default function CartView() {
  const { items, setQty, remove, subtotal } = useCart();
  const { t } = useLang();

  const fee = deliveryFeeFor(subtotal);

  const groups = useMemo(() => {
    const map = new Map<string, CartLine[]>();
    for (const line of items) {
      const product = getProduct(line.productId);
      if (!product) continue;
      const key = product.sellerId;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(line);
    }
    return [...map.entries()].map(([sellerId, lines]) => ({ sellerId, lines }));
  }, [items]);

  const totalUnits = items.reduce((a, l) => a + l.qty, 0);

  return (
    <div>
      {/* Progress stepper monolith */}
      <section className="w-full bg-surface-paper shadow-sm py-unit-lg px-margin-mobile md:px-margin-desktop">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-unit-md">
          <div className="flex items-center gap-unit-sm">
            <span className="w-2 h-2 bg-accent-crimson"></span>
            <h1 className="font-headline-lg text-headline-sm uppercase tracking-tight text-primary">
              {t("cart.finalize")}
            </h1>
            <span className="font-mono-technical text-mono-technical text-text-muted">
              {t("cart.refTag")}
            </span>
          </div>
          <CheckoutStepper activeStep={1} />
        </div>
      </section>

      {items.length === 0 ? (
        <main className="max-w-6xl mx-auto w-full px-margin-mobile md:px-margin-desktop py-unit-xl">
          <div className="flex flex-col items-start gap-6 bg-surface-paper p-unit-lg shadow-sm">
            <div>
              <h2 className="font-headline-lg text-headline-sm uppercase tracking-tight text-primary">
                {t("cart.emptyTitle")}
              </h2>
              <p className="mt-2 max-w-[44ch] font-body-utility text-text-muted leading-relaxed">
                {t("cart.emptyDesc")}
              </p>
            </div>
            <Link
              href="/category/all"
              className="w-full h-12 bg-primary text-on-primary font-headline-sm text-headline-sm uppercase tracking-wider flex items-center justify-center gap-unit-sm hover:bg-surface-charcoal transition-all"
            >
              {t("cart.viewCatalogue")}
            </Link>
          </div>
        </main>
      ) : (
        <main className="max-w-6xl mx-auto w-full px-margin-mobile md:px-margin-desktop py-unit-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-unit-xl items-start">
            {/* Left: multi-vendor cart packages */}
            <div className="lg:col-span-8 flex flex-col gap-unit-2xl">
              <section className="flex flex-col gap-unit-md">
                <div className="flex items-baseline justify-between pb-unit-xs">
                  <span className="font-label-caps text-label-caps uppercase text-primary tracking-widest flex items-center gap-unit-xs">
                    <span className="w-1.5 h-1.5 bg-primary"></span>
                    {t("cart.colisCount", { n: groups.length })}
                  </span>
                  <span className="font-mono-technical text-label-caps-sm text-text-muted uppercase">
                    {t("cart.articlesCount", { n: totalUnits })}
                  </span>
                </div>

                <div className="flex flex-col gap-unit-lg">
                  {groups.map((group, gi) => {
                    const seller = getSeller(group.sellerId);
                    const first = getProduct(group.lines[0].productId);
                    const sellerSub = seller
                      ? seller.location
                      : first?.sellerName;
                    return (
                      <div
                        key={group.sellerId}
                        className="bg-surface-paper p-unit-lg shadow-sm flex flex-col gap-unit-md"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-unit-xs bg-surface-container-low p-unit-sm">
                          <div className="flex items-center gap-unit-sm">
                            <StoreIcon size={18} className="text-primary" />
                            <div>
                              <h2 className="font-headline-sm text-headline-sm uppercase text-primary">
                                {seller?.name ?? first?.sellerName}
                              </h2>
                              <p className="font-label-caps-sm text-label-caps-sm text-text-muted uppercase">
                                {sellerSub} • {t("cart.vendorCertified")}
                              </p>
                            </div>
                          </div>
                          <span className="font-mono-technical text-label-caps-sm text-status-cod uppercase bg-surface-paper px-unit-xs py-unit-2xs">
                            {t("cart.colisLabel", {
                              n: gi + 1,
                              m: groups.length,
                            })}
                          </span>
                        </div>

                        {group.lines.map((line) => {
                          const product = getProduct(line.productId);
                          if (!product) return null;
                          const lineTotal = product.price * line.qty;
                          return (
                            <div
                              key={`${line.productId}-${line.size}`}
                              className="flex flex-col sm:flex-row gap-unit-md items-start"
                            >
                              <div className="w-full sm:w-28 h-36 bg-surface-container flex-shrink-0 overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={product.imageUrls[0]}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex flex-col justify-between flex-grow w-full h-full gap-unit-xs">
                                <div className="flex justify-between items-start gap-unit-sm">
                                  <div>
                                    <h3 className="font-headline-sm text-body-editorial text-primary uppercase font-bold">
                                      {product.name}
                                    </h3>
                                    <p className="font-body-utility text-body-utility text-text-muted">
                                      {t("cart.articlesCount", {
                                        n: product.sizes.length,
                                      })}
                                    </p>
                                    <div className="flex items-center gap-unit-sm mt-unit-xs font-mono-technical text-mono-technical text-primary">
                                      <span className="bg-surface-container-high px-unit-xs py-unit-2xs">
                                        {t("pdp.size")} {line.size}
                                      </span>
                                      <span className="bg-surface-container-high px-unit-xs py-unit-2xs">
                                        Qté {line.qty}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-headline-sm text-headline-sm text-primary font-bold">
                                      {formatPrice(lineTotal)}
                                    </span>
                                    <span className="block font-label-caps-sm text-label-caps-sm text-text-muted">
                                      {t("cart.priceShop")}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-unit-xs bg-surface-canvas p-unit-sm mt-unit-sm">
                                  <Stepper
                                    qty={line.qty}
                                    onInc={() =>
                                      setQty(
                                        line.productId,
                                        line.size,
                                        line.qty + 1
                                      )
                                    }
                                    onDec={() =>
                                      setQty(
                                        line.productId,
                                        line.size,
                                        Math.max(1, line.qty - 1)
                                      )
                                    }
                                  />
                                  <button
                                    type="button"
                                    onClick={() => remove(line.productId, line.size)}
                                    className="font-label-caps-sm text-label-caps-sm text-text-muted uppercase underline underline-offset-4 transition-colors hover:text-accent-crimson press focus-kill inline-flex items-center min-h-11 py-unit-sm"
                                  >
                                    {t("cart.remove")}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div className="bg-surface-canvas p-unit-sm flex flex-col sm:flex-row sm:items-center justify-between gap-unit-xs">
                          <div className="flex items-center gap-unit-xs">
                            <TruckIcon size={18} className="text-primary" />
                            <span className="font-label-caps-sm text-label-caps-sm text-primary uppercase font-bold">
                              {gi === 0
                                ? t("cart.shipExpress")
                                : t("cart.shipStandard")}
                            </span>
                          </div>
                          <span
                            className={`font-mono-technical text-mono-technical font-bold ${
                              fee === 0 ? "text-status-cod" : "text-primary"
                            }`}
                          >
                            {fee === 0
                              ? t("cart.freeDelivery")
                              : formatPrice(fee)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Right: summary monolith */}
            <aside className="lg:col-span-4 flex flex-col gap-unit-lg sticky top-28">
              <div className="bg-surface-paper p-unit-lg shadow-sm flex flex-col gap-unit-lg">
                <div className="flex items-center justify-between pb-unit-xs">
                  <h2 className="font-headline-sm text-headline-sm uppercase text-primary">
                    {t("cart.summaryTitle")}
                  </h2>
                  <span className="font-mono-technical text-label-caps-sm text-text-muted">
                    {t("cart.currency")}
                  </span>
                </div>
                <div className="flex flex-col gap-unit-sm font-body-utility">
                  <div className="flex justify-between items-center py-unit-xs">
                    <span className="text-text-muted uppercase">
                      {t("cart.subtotalLine", { n: totalUnits })}
                    </span>
                    <span className="font-mono-technical text-primary font-bold">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-unit-xs">
                    <span className="text-text-muted uppercase">
                      {t("cart.combinedFees")}
                    </span>
                    <span className="font-mono-technical text-primary font-bold">
                      {fee === 0 ? t("cart.freeDelivery") : formatPrice(fee)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-unit-xs">
                    <span className="text-text-muted uppercase">
                      {t("cart.codFees")}
                    </span>
                    <span className="font-mono-technical text-status-cod font-bold uppercase">
                      {t("cart.freeCod")}
                    </span>
                  </div>
                </div>
                <div className="bg-surface-charcoal text-surface-paper p-unit-md flex flex-col gap-unit-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="font-label-caps text-label-caps uppercase text-surface-container-highest tracking-wider">
                      {t("cart.netTotal")}
                    </span>
                    <span className="font-mono-technical text-[10px] uppercase text-accent-crimson">
                      {t("cart.payOnReceipt")}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="font-display-hero-mobile text-display-hero-mobile font-bold tracking-tight text-surface-paper">
                      {formatPrice(subtotal + fee).replace(" DZD", "")}
                    </span>
                    <span className="font-mono-technical text-headline-sm uppercase text-surface-container-highest">
                      DZD
                    </span>
                  </div>
                </div>
                <Link
                  href="/checkout"
                  className="w-full h-14 bg-primary text-on-primary font-headline-sm text-body-editorial uppercase tracking-wider font-bold flex items-center justify-center gap-unit-sm hover:bg-surface-charcoal transition-all shadow-sm"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <rect x="5" y="10.5" width="14" height="9" rx="1" />
                    <path d="M8 10.5 V7.5 a4 4 0 0 1 8 0 V10.5" />
                  </svg>
                  <span>{t("checkout.submitCod")}</span>
                </Link>
                <p className="font-label-caps-sm text-label-caps-sm text-text-muted uppercase text-center leading-normal">
                  {t("checkout.submitNote")}
                </p>
              </div>

              {/* Trust box */}
              <div className="bg-surface-paper p-unit-md shadow-sm flex flex-col gap-unit-md">
                <span className="font-label-caps-sm text-label-caps-sm uppercase tracking-widest text-primary font-bold">
                  {t("cart.guarantees")}
                </span>
                <div className="flex items-start gap-unit-sm">
                  <div className="w-8 h-8 bg-surface-container-low flex items-center justify-center flex-shrink-0">
                    <VerifiedIcon size={18} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="font-headline-sm text-body-utility uppercase font-bold text-primary">
                      {t("cart.guaranteeAuth")}
                    </h4>
                    <p className="font-body-utility text-body-utility text-text-muted">
                      {t("cart.guaranteeAuthBody")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-unit-sm">
                  <div className="w-8 h-8 bg-surface-container-low flex items-center justify-center flex-shrink-0">
                    <ShieldIcon size={18} className="text-status-cod" />
                  </div>
                  <div>
                    <h4 className="font-headline-sm text-body-utility uppercase font-bold text-primary">
                      {t("cart.guaranteeControl")}
                    </h4>
                    <p className="font-body-utility text-body-utility text-text-muted">
                      {t("cart.guaranteeControlBody")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-unit-sm">
                  <div className="w-8 h-8 bg-surface-container-low flex items-center justify-center flex-shrink-0">
                    <PersonIcon size={18} className="text-accent-crimson" />
                  </div>
                  <div>
                    <h4 className="font-headline-sm text-body-utility uppercase font-bold text-primary">
                      {t("cart.guaranteeConcierge")}
                    </h4>
                    <p className="font-body-utility text-body-utility text-text-muted">
                      {t("cart.guaranteeConciergeBody")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Logistics status */}
              <div className="bg-surface-container p-unit-md shadow-sm flex flex-col gap-unit-xs font-mono-technical">
                <div className="flex justify-between items-center text-label-caps-sm uppercase">
                  <span className="text-text-muted">
                    {t("cart.logisticsTitle")}
                  </span>
                  <span className="text-status-cod font-bold">
                    {t("cart.logisticsActive")}
                  </span>
                </div>
                <div className="w-full pt-1">
                  <svg
                    className="w-full h-8 text-primary"
                    fill="none"
                    preserveAspectRatio="none"
                    viewBox="0 0 240 24"
                  >
                    <rect fill="currentColor" height="16" opacity="0.9" width="50" x="0" y="8" />
                    <rect fill="currentColor" height="22" opacity="0.75" width="50" x="54" y="2" />
                    <rect fill="currentColor" height="14" opacity="0.6" width="50" x="108" y="10" />
                    <rect fill="currentColor" height="18" opacity="0.85" width="78" x="162" y="6" />
                  </svg>
                </div>
                <div className="flex justify-between text-[9px] text-text-muted uppercase">
                  <span>{t("cart.logisticsAlger")}</span>
                  <span>{t("cart.logisticsZR")}</span>
                  <span>{t("cart.logisticsYalidine")}</span>
                  <span>{t("cart.logisticsHome")}</span>
                </div>
              </div>
            </aside>
          </div>
        </main>
      )}
    </div>
  );
}