"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/lib/cart";
import { useLang } from "@/lib/i18n";
import { formatPrice, getProduct } from "@/lib/mock";
import { deliveryFeeFor, FREE_DELIVERY_OVER } from "@/lib/wilayas";
import { IconButton } from "@/components/ui";

export default function CartDrawer() {
  const { open, closeCart, items, setQty, remove, clear, subtotal } = useCart();
  const { t } = useLang();

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, closeCart]);

  const count = items.reduce((a, l) => a + l.qty, 0);

  return (
    <>
      <div
        onClick={closeCart}
        className={`fixed inset-0 z-50 bg-surface-charcoal/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("cart.title")}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border-rule bg-surface-paper shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border-rule px-unit-lg py-4">
          <h2 className="font-label-caps text-label-caps uppercase tracking-widest text-primary">
            {t("cart.count", { n: count })}
          </h2>
          <IconButton label={t("cart.close")} onClick={closeCart} className="h-10 w-10 border border-border-rule bg-surface-paper">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 6 L18 18 M18 6 L6 18" />
            </svg>
          </IconButton>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col justify-between px-unit-lg py-8">
            <div>
              <h3 className="font-headline-lg text-headline-lg uppercase leading-tight tracking-tight text-primary">
                {t("cart.emptyTitle")}
              </h3>
              <p className="mt-3 font-body-editorial text-body-editorial text-text-muted">
                {t("cart.emptyDesc")}
              </p>
            </div>
            <Link
              href="/"
              onClick={closeCart}
              className="press focus-kill inline-flex h-12 w-full items-center justify-center bg-primary px-unit-md font-label-caps text-label-caps uppercase tracking-wider text-on-primary transition-all hover:bg-accent-crimson"
            >
              {t("cart.viewCatalogue")}
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              <ul className="divide-y divide-border-rule">
                {items.map((line) => {
                  const product = getProduct(line.productId);
                  if (!product) return null;
                  return (
                    <li key={`${line.productId}-${line.size}`} className="flex gap-4 px-unit-lg py-5">
                      {/* Cart thumbnail = product cover (imageUrls[0], slot ab-XX). See lib/mock.ts. */}
                      <Link
                        href={`/product/${product.id}`}
                        onClick={closeCart}
                        className="relative block h-24 w-24 shrink-0 overflow-hidden border border-border-rule bg-surface-canvas"
                      >
                        <Image
                          src={product.imageUrls[0]}
                          alt={product.name}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link
                              href={`/product/${product.id}`}
                              onClick={closeCart}
                              className="focus-kill block truncate font-headline-sm text-headline-sm uppercase leading-snug tracking-tight text-primary"
                            >
                              {product.name}
                            </Link>
                            <p className="mt-0.5 font-mono-technical text-label-caps uppercase text-text-muted">
                              {product.sellerName} /{" "}
                              <span className="text-primary">{line.size}</span>
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => remove(line.productId, line.size)}
                            aria-label={`${t("cart.remove")} ${product.name}`}
                            className="press focus-kill font-label-caps-sm text-label-caps-sm uppercase text-text-muted underline underline-offset-2 transition-colors hover:text-primary inline-flex items-center min-h-11 py-unit-sm"
                          >
                            {t("cart.remove")}
                          </button>
                        </div>
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex h-11 items-center border border-border-rule bg-surface-canvas">
                            <button
                              type="button"
                              aria-label="−"
                              onClick={() => setQty(line.productId, line.size, line.qty - 1)}
                              className="press focus-kill flex h-full w-11 items-center justify-center text-primary transition-colors hover:bg-surface-paper"
                            >
                              −
                            </button>
                            <span className="min-w-6 text-center font-mono-technical text-body-utility tabular-nums text-primary">
                              {line.qty}
                            </span>
                            <button
                              type="button"
                              aria-label="+"
                              onClick={() => setQty(line.productId, line.size, line.qty + 1)}
                              className="press focus-kill flex h-full w-11 items-center justify-center text-primary transition-colors hover:bg-surface-paper"
                            >
                              +
                            </button>
                          </div>
                          <p className="font-mono-technical text-body-utility font-bold tabular-nums text-primary">
                            {formatPrice(product.price * line.qty)}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="px-unit-lg py-4">
                <button
                  type="button"
                  onClick={clear}
                  className="press focus-kill font-label-caps-sm text-label-caps-sm uppercase text-text-muted underline underline-offset-2 transition-colors hover:text-primary inline-flex items-center min-h-11 py-unit-sm"
                >
                  {t("cart.emptyCart")}
                </button>
              </div>
            </div>

            <div className="border-t border-border-rule px-unit-lg py-5">
              <div className="flex items-baseline justify-between">
                <span className="font-label-caps text-label-caps uppercase tracking-widest text-primary">
                  {t("cart.subtotal")}
                </span>
                <span className="font-mono-technical text-headline-sm font-bold tabular-nums text-primary">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <p className="mt-1.5 font-mono-technical text-mono-technical text-status-cod">
                {deliveryFeeFor(subtotal) === 0
                  ? t("cart.freeDelivery")
                  : t("cart.deliveryHint", {
                      fee: formatPrice(deliveryFeeFor(subtotal)),
                      freeOver: formatPrice(FREE_DELIVERY_OVER),
                    })}
              </p>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="press focus-kill mt-4 inline-flex h-12 w-full items-center justify-center bg-primary px-unit-md font-label-caps text-label-caps uppercase tracking-wider text-on-primary transition-all hover:bg-accent-crimson"
              >
                {t("cart.checkout")}
              </Link>
              <Link
                href="/cart"
                onClick={closeCart}
                className="focus-kill mt-3 block text-center font-label-caps-sm text-label-caps-sm uppercase text-text-muted underline underline-offset-4 transition-colors hover:text-primary"
              >
                {t("cart.viewBag")}
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}