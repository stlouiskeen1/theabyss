"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { buildOrderItems, useOrders } from "@/lib/orders";
import { useLang } from "@/lib/i18n";
import { formatPrice, getProduct } from "@/lib/mock";
import {
  WILAYAS_ALPHABETICAL,
  deliveryFeeFor,
  wilayaName,
} from "@/lib/wilayas";
import CheckoutStepper from "@/components/CheckoutStepper";
import {
  ChevronDownIcon,
  PaymentsIcon,
  VerifiedIcon,
} from "@/components/ui";

const ALGER_COMMUNES = [
  "Hydra",
  "Sidi Yahia / Saïd Hamdine",
  "El Biar",
  "Dely Brahim",
  "Ben Aknoun",
  "Kouba",
  "Bab Ezzouar",
];

const ORAN_COMMUNES = [
  "Oran Centre / Front de Mer",
  "Akid Lotfi",
  "Es Sénia",
  "Bir El Djir",
];

const OTHER_COMMUNES = [
  "Commune Chef-Lieu",
  "Centre-Ville",
  "Secteur Urbain Est",
];

const communesFor = (wilaya: string) =>
  wilaya === "16"
    ? ALGER_COMMUNES
    : wilaya === "31"
      ? ORAN_COMMUNES
      : OTHER_COMMUNES;

const isValidPhone = (raw: string) => {
  let digits = raw.replace(/[\s.\-()]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("213")) digits = "0" + digits.slice(3);
  return /^0[567]\d{8}$/.test(digits);
};

const fieldClass = (err: boolean) =>
  `w-full h-12 bg-surface-container-low px-unit-md font-mono-technical text-mono-technical uppercase text-primary focus:outline-none focus:bg-surface-container-high transition-colors ${
    err ? "ring-1 ring-accent-crimson" : ""
  }`;

export default function CheckoutView() {
  const { items, subtotal, clear } = useCart();
  const { placeOrder } = useOrders();
  const { t } = useLang();

  const [fields, setFields] = useState({
    name: "",
    phone: "",
    wilaya: "16",
    commune: ALGER_COMMUNES[0],
    address: "",
  });
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [payment, setPayment] = useState<"cod" | "cib">("cod");
  const [order, setOrder] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);

  const fee = deliveryFeeFor(subtotal);
  const total = subtotal + fee;
  const communes = useMemo(
    () => communesFor(fields.wilaya),
    [fields.wilaya]
  );

  const set = (key: keyof typeof fields) => (value: string) => {
    setFields((f) => ({ ...f, [key]: value }));
    setErrors((er) => ({ ...er, [key]: false }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, boolean> = {};
    if (fields.name.trim().length < 2) next.name = true;
    if (!isValidPhone(fields.phone)) next.phone = true;
    if (!fields.wilaya) next.wilaya = true;
    if (!fields.commune.trim()) next.commune = true;
    if (!fields.address.trim()) next.address = true;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setPlacing(true);
    setPlaceError(null);
    try {
      const placed = await placeOrder({
        customer: {
          name: fields.name.trim(),
          phone: fields.phone.trim(),
          wilaya: Number(fields.wilaya),
          commune: fields.commune.trim(),
          address: fields.address.trim(),
        },
        items: buildOrderItems(items),
        subtotal,
        deliveryFee: fee,
        total,
        payment,
      });
      setOrder(placed.ref);
      clear();
      if (typeof window !== "undefined")
        window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setPlaceError(t("checkout.errPlace"));
    } finally {
      setPlacing(false);
    }
  };

  const wilayaLabel = wilayaName(Number(fields.wilaya));

  return (
    <div>
      {/* Progress stepper monolith */}
      <section className="w-full bg-surface-paper shadow-sm py-unit-lg px-margin-mobile md:px-margin-desktop">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-unit-md">
          <div className="flex items-center gap-unit-sm">
            <span className="w-2 h-2 bg-status-cod"></span>
            <h1 className="font-headline-lg text-headline-sm uppercase tracking-tight text-primary">
              {t("cart.finalize")}
            </h1>
            <span className="font-mono-technical text-mono-technical text-text-muted">
              / {order ? `REF-${order}` : t("cart.refTag")}
            </span>
          </div>
          <CheckoutStepper activeStep={order ? 4 : 3} />
        </div>
      </section>

      {order ? (
        <main className="max-w-6xl mx-auto w-full px-margin-mobile md:px-margin-desktop py-unit-xl">
          <div className="bg-surface-paper p-unit-xl shadow-sm flex flex-col gap-unit-md">
            <div className="flex items-center gap-unit-sm">
              <span className="w-8 h-8 bg-status-cod flex items-center justify-center text-on-primary">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 13 L10 18 L19 7" />
                </svg>
              </span>
              <span className="font-label-caps-sm text-label-caps-sm text-status-cod uppercase tracking-widest">
                {t("pdp.availableHub")}
              </span>
            </div>
            <h2 className="font-headline-lg text-display-hero-mobile uppercase tracking-tight text-primary">
              {t("checkout.doneTitle")}
            </h2>
            <p className="font-mono-technical text-mono-technical text-text-muted uppercase">
              {t("checkout.doneNumber", { number: order })}
            </p>
            <p className="font-body-editorial text-body-editorial text-primary">
              {t("checkout.doneDesc", {
                total: formatPrice(total),
                commune: fields.commune,
                wilaya: wilayaLabel ?? fields.wilaya,
                phone: fields.phone,
              })}
            </p>
            <p className="font-mono-technical text-mono-technical text-status-cod">
              {t("checkout.doneHint", { total: formatPrice(total) })}
            </p>
            <Link
              href="/category/all"
              className="w-full sm:w-auto px-unit-xl h-12 bg-primary text-on-primary font-headline-sm text-body-editorial uppercase tracking-wider font-bold flex items-center justify-center gap-unit-sm hover:bg-surface-charcoal transition-all shadow-sm"
            >
              {t("checkout.backHome")}
            </Link>
          </div>
        </main>
      ) : items.length === 0 ? (
        <main className="max-w-6xl mx-auto w-full px-margin-mobile md:px-margin-desktop py-unit-xl">
          <div className="flex flex-col items-start gap-6 bg-surface-paper p-unit-lg shadow-sm">
            <div>
              <h2 className="font-headline-lg text-headline-sm uppercase tracking-tight text-primary">
                {t("checkout.emptyTitle")}
              </h2>
              <p className="mt-2 max-w-[44ch] font-body-utility text-text-muted leading-relaxed">
                {t("checkout.emptyDesc")}
              </p>
            </div>
            <Link
              href="/category/all"
              className="w-full h-12 bg-primary text-on-primary font-headline-sm text-headline-sm uppercase tracking-wider flex items-center justify-center gap-unit-sm hover:bg-surface-charcoal transition-all"
            >
              {t("checkout.browse")}
            </Link>
          </div>
        </main>
      ) : (
        <main className="max-w-6xl mx-auto w-full px-margin-mobile md:px-margin-desktop py-unit-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-unit-xl items-start">
            {/* Left: delivery + payment */}
            <div className="lg:col-span-8 flex flex-col gap-unit-2xl">
              {/* Delivery details */}
              <section className="bg-surface-paper p-unit-lg shadow-sm flex flex-col gap-unit-lg">
                <div className="flex items-center justify-between pb-unit-xs">
                  <div className="flex items-center gap-unit-xs">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-accent-crimson"
                      aria-hidden="true"
                    >
                      <path d="M12 21 C 12 21 5 14.5 5 10 a7 7 0 0 1 14 0 C 19 14.5 12 21 12 21 Z" />
                      <circle cx="12" cy="10" r="2.5" />
                    </svg>
                    <h2 className="font-headline-sm text-headline-sm uppercase text-primary">
                      {t("checkout.shippingTitle")}
                    </h2>
                  </div>
                  <span className="font-label-caps-sm text-label-caps-sm text-status-cod uppercase bg-surface-container px-unit-sm py-1">
                    {t("checkout.phoneValidation")}
                  </span>
                </div>

                <form
                  id="abyss-checkout"
                  onSubmit={submit}
                  className="grid grid-cols-1 md:grid-cols-2 gap-unit-md"
                >
                  <div className="flex flex-col gap-unit-2xs">
                    <label
                      htmlFor="co-name"
                      className="font-label-caps text-label-caps text-text-muted uppercase"
                    >
                      {t("checkout.fullNameLabel")}
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="co-name"
                        type="text"
                        placeholder={t("checkout.namePlaceholder")}
                        value={fields.name}
                        onChange={(e) => set("name")(e.target.value)}
                        className={fieldClass(!!errors.name)}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-unit-2xs">
                    <div className="flex justify-between items-center">
                      <label
                        htmlFor="co-phone"
                        className="font-label-caps text-label-caps text-text-muted uppercase"
                      >
                        {t("checkout.phoneLabel")}
                      </label>
                      <span className="font-label-caps-sm text-label-caps-sm text-accent-crimson uppercase">
                        {t("checkout.mandatory")}
                      </span>
                    </div>
                    <div className="relative flex items-center">
                      <div className="absolute left-unit-md flex items-center gap-1 font-mono-technical text-mono-technical uppercase text-primary">
                        <span>{t("checkout.phonePrefix")}</span>
                        <span className="text-text-muted">|</span>
                      </div>
                      <input
                        id="co-phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder={t("checkout.phonePlaceholder2")}
                        value={fields.phone}
                        onChange={(e) => set("phone")(e.target.value)}
                        className={`${fieldClass(!!errors.phone)} pl-16`}
                      />
                    </div>
                    <span className="font-label-caps-sm text-label-caps-sm text-text-muted uppercase">
                      {t("checkout.phoneNote")}
                    </span>
                  </div>
                  <div className="flex flex-col gap-unit-2xs">
                    <label
                      htmlFor="co-wilaya"
                      className="font-label-caps text-label-caps text-text-muted uppercase"
                    >
                      {t("checkout.wilayaLabel")}
                    </label>
                    <div className="relative">
                      <select
                        id="co-wilaya"
                        value={fields.wilaya}
                        onChange={(e) => {
                          set("wilaya")(e.target.value);
                          set("commune")(communesFor(e.target.value)[0]);
                        }}
                        className={`${fieldClass(!!errors.wilaya)} appearance-none pr-10 cursor-pointer`}
                      >
                        {WILAYAS_ALPHABETICAL.map((w) => (
                          <option key={w.code} value={w.code}>
                            {w.code} - {w.name}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-3 text-primary">
                        <ChevronDownIcon className="h-5 w-5" />
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-unit-2xs">
                    <label
                      htmlFor="co-commune"
                      className="font-label-caps text-label-caps text-text-muted uppercase"
                    >
                      {t("checkout.communeLabel")}
                    </label>
                    <div className="relative">
                      <select
                        id="co-commune"
                        value={fields.commune}
                        onChange={(e) => set("commune")(e.target.value)}
                        className={`${fieldClass(!!errors.commune)} appearance-none pr-10 cursor-pointer`}
                      >
                        {communes.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-3 text-primary">
                        <ChevronDownIcon className="h-5 w-5" />
                      </span>
                    </div>
                  </div>
                  <div className="md:col-span-2 flex flex-col gap-unit-2xs">
                    <label
                      htmlFor="co-address"
                      className="font-label-caps text-label-caps text-text-muted uppercase"
                    >
                      {t("checkout.addressLabel")}
                    </label>
                    <textarea
                      id="co-address"
                      placeholder={t("checkout.addressPlaceholder")}
                      rows={3}
                      value={fields.address}
                      onChange={(e) => set("address")(e.target.value)}
                      className={`w-full bg-surface-container-low p-unit-md font-body-utility text-body-utility text-primary focus:outline-none focus:bg-surface-container-high transition-colors ${
                        errors.address ? "ring-1 ring-accent-crimson" : ""
                      }`}
                    />
                  </div>
                </form>
              </section>

              {/* Payment method */}
              <section className="bg-surface-paper p-unit-lg shadow-sm flex flex-col gap-unit-md">
                <div className="flex items-center justify-between pb-unit-xs">
                  <h2 className="font-headline-sm text-headline-sm uppercase text-primary flex items-center gap-unit-xs">
                    <PaymentsIcon size={20} className="text-primary" />
                    {t("checkout.paymentTitle")}
                  </h2>
                  <span className="font-label-caps-sm text-label-caps-sm text-text-muted uppercase">
                    {t("checkout.wilayasCompatible")}
                  </span>
                </div>
                <div className="flex flex-col gap-unit-md">
                  <label
                    className={`relative flex flex-col md:flex-row md:items-center justify-between p-unit-md cursor-pointer transition-all ${
                      payment === "cod"
                        ? "bg-surface-container-low"
                        : "bg-surface-container-low opacity-90 hover:bg-surface-container-low"
                    }`}
                  >
                    <div className="flex items-start gap-unit-md">
                      <input
                        type="radio"
                        name="payment_method"
                        value="cod"
                        checked={payment === "cod"}
                        onChange={() => setPayment("cod")}
                        className="mt-1 accent-accent-crimson w-4 h-4 cursor-pointer"
                      />
                      <div className="flex flex-col gap-unit-xs">
                        <div className="flex items-center gap-unit-sm flex-wrap">
                          <span className="font-headline-sm text-body-editorial font-bold uppercase text-primary">
                            {t("checkout.cod")}
                          </span>
                          <span className="bg-status-cod text-surface-paper font-label-caps-sm text-label-caps-sm px-unit-xs py-unit-2xs uppercase tracking-wider">
                            {t("checkout.codRecommended")}
                          </span>
                        </div>
                        <p className="font-body-utility text-body-utility text-text-muted max-w-xl">
                          {t("checkout.codDesc2")}
                        </p>
                        <div className="flex items-center gap-unit-sm font-mono-technical text-label-caps-sm text-status-cod uppercase mt-1">
                          <VerifiedIcon size={14} />
                          <span>{t("checkout.codNoPrepay")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-unit-sm md:mt-0 flex-shrink-0 text-right">
                      <span className="font-mono-technical text-mono-technical font-bold text-accent-crimson uppercase">
                        {t("checkout.codFee")}
                      </span>
                    </div>
                  </label>

                  <label
                    className={`relative flex flex-col md:flex-row md:items-center justify-between p-unit-md cursor-pointer transition-all ${
                      payment === "cib"
                        ? "bg-surface-container-low"
                        : "bg-surface-canvas opacity-90 hover:bg-surface-container-low"
                    }`}
                  >
                    <div className="flex items-start gap-unit-md">
                      <input
                        type="radio"
                        name="payment_method"
                        value="cib"
                        checked={payment === "cib"}
                        onChange={() => setPayment("cib")}
                        className="mt-1 accent-accent-crimson w-4 h-4 cursor-pointer"
                      />
                      <div className="flex flex-col gap-unit-xs">
                        <div className="flex items-center gap-unit-sm flex-wrap">
                          <span className="font-headline-sm text-body-editorial font-bold uppercase text-primary">
                            {t("checkout.cibTitle")}
                          </span>
                          <span className="bg-surface-container-high text-text-muted font-label-caps-sm text-label-caps-sm px-unit-xs py-unit-2xs uppercase tracking-wider">
                            {t("checkout.cibBadge")}
                          </span>
                        </div>
                        <p className="font-body-utility text-body-utility text-text-muted max-w-xl">
                          {t("checkout.cibDesc")}
                        </p>
                        <div className="flex items-center gap-unit-sm pt-1">
                          <div className="px-2 py-0.5 bg-primary text-surface-paper font-mono-technical text-[10px] uppercase font-bold">
                            EDAHABIA
                          </div>
                          <div className="px-2 py-0.5 bg-surface-charcoal text-surface-paper font-mono-technical text-[10px] uppercase font-bold">
                            CIB / SATIM
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-unit-sm md:mt-0 flex-shrink-0 text-right">
                      <span className="font-label-caps-sm text-label-caps-sm text-text-muted uppercase">
                        {t("checkout.cibGateway")}
                      </span>
                    </div>
                  </label>
                </div>
              </section>
            </div>

            {/* Right: summary + logistics */}
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
                      {t("cart.subtotalLine", {
                        n: items.reduce((a, l) => a + l.qty, 0),
                      })}
                    </span>
                    <span className="font-mono-technical text-primary font-bold">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <ul className="flex flex-col gap-unit-xs">
                    {items.map((line) => {
                      const product = getProduct(line.productId);
                      if (!product) return null;
                      return (
                        <li
                          key={`${line.productId}-${line.size}`}
                          className="flex items-center gap-unit-sm bg-surface-container-low p-unit-sm"
                        >
                          <span className="block h-14 w-14 flex-shrink-0 overflow-hidden bg-surface-container">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={product.imageUrls[0]}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-label-caps-sm text-label-caps-sm uppercase text-primary font-bold">
                              {product.name}
                            </p>
                            <p className="font-mono-technical text-mono-technical text-text-muted uppercase">
                              {t("pdp.size")} {line.size} · ×{line.qty}
                            </p>
                          </div>
                          <span className="flex-shrink-0 font-mono-technical text-mono-technical text-primary font-bold">
                            {formatPrice(product.price * line.qty)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
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
                      {formatPrice(total).replace(" DZD", "")}
                    </span>
                    <span className="font-mono-technical text-headline-sm uppercase text-surface-container-highest">
                      DZD
                    </span>
                  </div>
                </div>
                {placeError ? (
                  <p className="font-label-caps-sm text-label-caps-sm text-accent-crimson uppercase text-center leading-normal">
                    {placeError}
                  </p>
                ) : null}
                <button
                  type="submit"
                  form="abyss-checkout"
                  disabled={placing}
                  aria-busy={placing}
                  className="w-full h-14 bg-primary text-on-primary font-headline-sm text-body-editorial uppercase tracking-wider font-bold flex items-center justify-center gap-unit-sm hover:bg-surface-charcoal transition-all shadow-sm disabled:opacity-60"
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
                    {payment === "cod" ? (
                      <g key="cod">
                        <rect x="5" y="10.5" width="14" height="9" rx="1" />
                        <path d="M8 10.5 V7.5 a4 4 0 0 1 8 0 V10.5" />
                      </g>
                    ) : (
                      <g key="cib">
                        <rect x="2.5" y="5" width="15" height="12" rx="1" />
                        <path d="M19 9 H21 V17 A2 2 0 0 1 19 19 H6" />
                        <path d="M2.5 9 H17.5" />
                      </g>
                    )}
                  </svg>
                  <span>
                    {payment === "cod"
                      ? t("checkout.submitCod")
                      : t("checkout.submitCib")}
                  </span>
                </button>
                <p className="font-label-caps-sm text-label-caps-sm text-text-muted uppercase text-center leading-normal">
                  {t("checkout.submitNote")}
                </p>
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