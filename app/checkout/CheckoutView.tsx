"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { useLang } from "@/lib/i18n";
import { formatPrice, getProduct } from "@/lib/mock";
import {
  WILAYAS_ALPHABETICAL,
  deliveryFeeFor,
  wilayaName,
} from "@/lib/wilayas";
import { ButtonLink } from "@/components/ui";

const fieldClass = (err: boolean) =>
  `w-full rounded-md border border-hairline bg-canvas px-3.5 py-3 text-sm text-ink transition-colors focus-kill ${
    err ? "!border-sale" : "focus:border-ink"
  }`;

type Fields = {
  name: string;
  phone: string;
  wilaya: string;
  commune: string;
  address: string;
};

const EMPTY: Fields = { name: "", phone: "", wilaya: "", commune: "", address: "" };

const isValidPhone = (raw: string) => {
  let digits = raw.replace(/[\s.\-()]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("213")) digits = "0" + digits.slice(3);
  return /^0[567]\d{8}$/.test(digits);
};

export default function CheckoutView() {
  const { items, subtotal, clear } = useCart();
  const { t } = useLang();

  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Fields>>({});
  const [order, setOrder] = useState<string | null>(null);

  const fee = deliveryFeeFor(subtotal);
  const total = subtotal + fee;

  const set = (key: keyof Fields) => (e: { target: { value: string } }) => {
    setFields((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Partial<Fields> = {};
    if (fields.name.trim().length < 2) next.name = t("checkout.errName");
    if (!isValidPhone(fields.phone)) next.phone = t("checkout.errPhone");
    if (!fields.wilaya) next.wilaya = t("checkout.errWilaya");
    if (!fields.commune.trim()) next.commune = t("checkout.errCommune");
    if (!fields.address.trim()) next.address = t("checkout.errAddress");
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setOrder(`AB-${Math.floor(1000 + Math.random() * 9000)}`);
    clear();
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const wilaya = wilayaName(Number(fields.wilaya));

  if (order) {
    return (
      <div className="px-5 pb-20 pt-8 sm:px-8">
        <div className="mx-auto flex max-w-xl flex-col items-start rounded-[18px] border border-hairline-soft bg-canvas p-8 sm:p-10">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 13 L10 18 L19 7" />
            </svg>
          </span>
          <h1 className="mt-6 font-display text-4xl font-normal uppercase leading-[0.95] tracking-tight text-ink sm:text-5xl">
            {t("checkout.doneTitle")}
          </h1>
          <p className="mt-4 text-sm font-medium uppercase tracking-wide text-mute">
            {t("checkout.doneNumber", { number: order })}
          </p>
          <p className="mt-6 max-w-[48ch] text-sm leading-6 text-charcoal">
            {t("checkout.doneDesc", {
              total: formatPrice(total),
              commune: fields.commune.trim(),
              wilaya: wilaya ?? fields.wilaya,
              phone: fields.phone.trim(),
            })}
          </p>
          <p className="mt-3 text-sm leading-6 text-success">
            {t("checkout.doneHint", { total: formatPrice(total) })}
          </p>
          <ButtonLink href="/category/all" variant="primary" className="mt-8">
            {t("checkout.backHome")}
          </ButtonLink>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="px-5 pb-20 pt-8 sm:px-8">
        <div className="flex flex-col items-start gap-6 rounded-[18px] border border-hairline-soft bg-canvas p-8">
          <div>
            <h1 className="font-display text-3xl font-normal uppercase leading-[0.95] tracking-tight text-ink">
              {t("checkout.emptyTitle")}
            </h1>
            <p className="mt-2 max-w-[40ch] text-sm leading-6 text-charcoal">
              {t("checkout.emptyDesc")}
            </p>
          </div>
          <ButtonLink href="/category/all" variant="primary">
            {t("checkout.browse")}
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-20 pt-8 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-mute">
            {t("checkout.title")}
          </p>
          <h1 className="mt-3 text-[28px] font-medium uppercase tracking-tight text-ink sm:text-[32px]">
            {t("checkout.title")}
          </h1>
        </div>
        <Link
          href="/cart"
          className="press w-fit text-sm font-medium uppercase text-mute underline underline-offset-4 transition-colors hover:text-ink"
        >
          {t("checkout.back")}
        </Link>
      </div>

      <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="flex flex-col gap-6">
          <section className="rounded-[18px] border border-hairline-soft bg-canvas p-6 sm:p-8">
            <h2 className="text-sm font-medium uppercase tracking-wide text-ink">
              01 — {t("checkout.contact")}
            </h2>
            <div className="mt-5 flex flex-col gap-4">
              <div>
                <label htmlFor="co-name" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-mute">
                  {t("checkout.fullName")}
                </label>
                <input
                  id="co-name"
                  type="text"
                  autoComplete="name"
                  value={fields.name}
                  onChange={set("name")}
                  className={fieldClass(!!errors.name)}
                />
                {errors.name && <p className="mt-1.5 text-xs text-sale">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="co-phone" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-mute">
                  {t("checkout.phone")}
                </label>
                <input
                  id="co-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder={t("checkout.phonePlaceholder")}
                  value={fields.phone}
                  onChange={set("phone")}
                  className={fieldClass(!!errors.phone)}
                />
                <p className="mt-1.5 text-xs text-mute">{t("checkout.phoneHint")}</p>
                {errors.phone && <p className="mt-1 text-xs text-sale">{errors.phone}</p>}
              </div>
            </div>
          </section>

          <section className="rounded-[18px] border border-hairline-soft bg-canvas p-6 sm:p-8">
            <h2 className="text-sm font-medium uppercase tracking-wide text-ink">
              02 — {t("checkout.delivery")}
            </h2>
            <p className="mt-1.5 text-xs text-mute">{t("checkout.deliveryNote")}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="co-wilaya" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-mute">
                  {t("checkout.wilaya")}
                </label>
                <select
                  id="co-wilaya"
                  value={fields.wilaya}
                  onChange={set("wilaya")}
                  className={`${fieldClass(!!errors.wilaya)} cursor-pointer`}
                >
                  <option value="" disabled>
                    {t("checkout.selectWilaya")}
                  </option>
                  {WILAYAS_ALPHABETICAL.map((w) => (
                    <option key={w.code} value={w.code}>
                      {w.code} — {w.name}
                    </option>
                  ))}
                </select>
                {errors.wilaya && <p className="mt-1.5 text-xs text-sale">{errors.wilaya}</p>}
              </div>
              <div>
                <label htmlFor="co-commune" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-mute">
                  {t("checkout.commune")}
                </label>
                <input
                  id="co-commune"
                  type="text"
                  autoComplete="address-level4"
                  value={fields.commune}
                  onChange={set("commune")}
                  className={fieldClass(!!errors.commune)}
                />
                {errors.commune && <p className="mt-1.5 text-xs text-sale">{errors.commune}</p>}
              </div>
            </div>
            <div className="mt-4">
              <label htmlFor="co-address" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-mute">
                {t("checkout.address")}
              </label>
              <input
                id="co-address"
                type="text"
                autoComplete="street-address"
                value={fields.address}
                onChange={set("address")}
                className={fieldClass(!!errors.address)}
              />
              {errors.address && <p className="mt-1.5 text-xs text-sale">{errors.address}</p>}
            </div>
          </section>

          <section className="rounded-[18px] border border-hairline-soft bg-canvas p-6 sm:p-8">
            <h2 className="text-sm font-medium uppercase tracking-wide text-ink">
              03 — {t("checkout.payment")}
            </h2>
            <label className="mt-5 flex cursor-pointer items-start gap-4 rounded-lg border border-ink bg-soft-cloud p-4">
              <input
                type="radio"
                name="payment"
                value="cod"
                defaultChecked
                className="mt-0.5 h-4 w-4 cursor-pointer accent-ink"
              />
              <span>
                <span className="block text-sm font-medium uppercase text-ink">
                  {t("checkout.cod")}
                </span>
                <span className="mt-1 block text-sm leading-5 text-charcoal">
                  {t("checkout.codDesc")}
                </span>
              </span>
            </label>
          </section>
        </div>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-8">
          <div className="rounded-[18px] border border-hairline-soft bg-canvas p-6">
            <h2 className="text-sm font-medium uppercase tracking-wide text-ink">
              {t("checkout.summary")}
            </h2>
            <ul className="mt-4 flex flex-col gap-4">
              {items.map((line) => {
                const product = getProduct(line.productId);
                if (!product) return null;
                return (
                  <li key={`${line.productId}-${line.size}`} className="flex items-center gap-3">
                    <span className="block h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-soft-cloud">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={product.imageUrls[0]} alt="" className="h-full w-full object-cover" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium uppercase tracking-tight text-ink">
                        {product.name}
                      </p>
                      <p className="mt-0.5 text-xs text-mute">
                        {t("pdp.size")} {line.size} · ×{line.qty}
                      </p>
                    </div>
                    <p className="flex-shrink-0 text-sm font-medium tabular-nums text-ink">
                      {formatPrice(product.price * line.qty)}
                    </p>
                  </li>
                );
              })}
            </ul>
            <div className="mt-5 flex flex-col gap-2 border-t border-hairline-soft pt-4 text-sm">
              <div className="flex items-center justify-between text-charcoal">
                <span>{t("cart.subtotal")}</span>
                <span className="tabular-nums">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-charcoal">
                <span>{t("checkout.deliveryFee")}</span>
                {fee === 0 ? (
                  <span className="text-success">{t("checkout.free")}</span>
                ) : (
                  <span className="tabular-nums">{formatPrice(fee)}</span>
                )}
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-hairline-soft pt-3 text-base font-medium text-ink">
                <span>{t("checkout.total")}</span>
                <span className="tabular-nums">{formatPrice(total)}</span>
              </div>
            </div>
            <p className="mt-4 rounded-md bg-soft-cloud px-3 py-2.5 text-xs leading-5 text-charcoal">
              {t("checkout.payNote", { total: formatPrice(total) })}
            </p>
          </div>

          <button
            type="submit"
            className="press focus-kill h-12 w-full rounded-lg bg-ink px-8 text-sm font-medium uppercase text-canvas transition-colors hover:bg-charcoal"
          >
            {t("checkout.placeOrder")}
          </button>
          <p className="text-center text-xs leading-5 text-mute">{t("checkout.demo")}</p>
        </aside>
      </form>
    </div>
  );
}