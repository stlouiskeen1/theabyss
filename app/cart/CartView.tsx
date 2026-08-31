"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { useLang } from "@/lib/i18n";
import { formatPrice, getProduct } from "@/lib/mock";
import { deliveryFeeFor, FREE_DELIVERY_OVER } from "@/lib/wilayas";
import { ButtonLink } from "@/components/ui";

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
    <div className="inline-flex items-center rounded-lg border border-hairline bg-soft-cloud">
      <button
        type="button"
        onClick={onDec}
        aria-label={t("cart.dec")}
        className="press focus-kill flex h-9 w-9 items-center justify-center text-ink transition-colors hover:bg-hairline-soft"
      >
        −
      </button>
      <span className="w-8 text-center text-sm font-medium tabular-nums text-ink">
        {qty}
      </span>
      <button
        type="button"
        onClick={onInc}
        aria-label={t("cart.inc")}
        className="press focus-kill flex h-9 w-9 items-center justify-center text-ink transition-colors hover:bg-hairline-soft"
      >
        +
      </button>
    </div>
  );
}

export default function CartView() {
  const { items, setQty, remove, clear, subtotal } = useCart();
  const { t } = useLang();

  const fee = deliveryFeeFor(subtotal);
  const total = subtotal + fee;

  return (
    <div className="px-5 pb-20 pt-8 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-mute">
            {t("cart.title")}
          </p>
          <h1 className="mt-3 text-[28px] font-medium uppercase tracking-tight text-ink sm:text-[32px]">
            {t("cart.count", { n: items.reduce((a, l) => a + l.qty, 0) })}
          </h1>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="press focus-kill w-fit text-sm font-medium uppercase text-mute underline underline-offset-4 transition-colors hover:text-sale"
          >
            {t("cart.emptyCart")}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-10 flex flex-col items-start gap-6 rounded-[18px] border border-hairline-soft bg-canvas p-8">
          <div>
            <h2 className="font-display text-xl font-normal uppercase tracking-tight text-ink sm:text-2xl">
              {t("cart.emptyTitle")}
            </h2>
            <p className="mt-2 max-w-[40ch] text-sm leading-6 text-charcoal">
              {t("cart.emptyDesc")}
            </p>
          </div>
          <ButtonLink href="/category/all" variant="primary">
            {t("cart.viewCatalogue")}
          </ButtonLink>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
          <ul className="flex flex-col gap-4">
            {items.map((line) => {
              const product = getProduct(line.productId);
              if (!product) return null;
              const lineTotal = product.price * line.qty;
              return (
                <li
                  key={`${line.productId}-${line.size}`}
                  className="flex gap-4 rounded-[18px] border border-hairline-soft bg-canvas p-4 sm:gap-6 sm:p-5"
                >
                  <Link
                    href={`/product/${product.id}`}
                    className="block flex-shrink-0"
                  >
                    <span className="block h-28 w-24 overflow-hidden rounded-lg bg-soft-cloud sm:h-36 sm:w-28">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.imageUrls[0]}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </span>
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <Link
                          href={`/product/${product.id}`}
                          className="block truncate text-sm font-medium uppercase tracking-tight text-ink transition-colors hover:text-charcoal sm:text-base"
                        >
                          {product.name}
                        </Link>
                        <p className="mt-1 text-xs leading-5 text-mute">
                          {t("pdp.size")} {line.size}
                        </p>
                      </div>
                      <p className="flex-shrink-0 text-sm font-medium tabular-nums text-ink sm:text-base">
                        {formatPrice(lineTotal)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <Stepper
                        qty={line.qty}
                        onInc={() => setQty(line.productId, line.size, line.qty + 1)}
                        onDec={() => setQty(line.productId, line.size, Math.max(1, line.qty - 1))}
                      />
                      <button
                        type="button"
                        onClick={() => remove(line.productId, line.size)}
                        className="press focus-kill text-xs font-medium uppercase text-mute underline underline-offset-4 transition-colors hover:text-sale"
                      >
                        {t("cart.remove")}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <aside className="rounded-[18px] border border-hairline-soft bg-canvas p-6 lg:sticky lg:top-8">
            <h2 className="text-sm font-medium uppercase tracking-wide text-ink">
              {t("cart.subtotal")}
            </h2>
            <div className="mt-4 flex flex-col gap-2 text-sm">
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
            <p className="mt-3 text-xs leading-5 text-mute">
              {fee === 0
                ? t("cart.freeDelivery")
                : t("cart.deliveryHint", {
                    fee: formatPrice(fee),
                    freeOver: formatPrice(FREE_DELIVERY_OVER),
                  })}
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <ButtonLink href="/checkout" variant="primary" className="w-full">
                {t("cart.checkout")}
              </ButtonLink>
              <ButtonLink href="/category/all" variant="ghost" className="w-full">
                {t("cart.continue")}
              </ButtonLink>
            </div>
            <p className="mt-4 text-xs leading-5 text-mute">
              {t("cart.subtotalNote")}
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}