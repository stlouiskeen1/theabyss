"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/lib/cart";
import { useLang } from "@/lib/i18n";
import { formatPrice, getProduct } from "@/lib/mock";
import { deliveryFeeFor, FREE_DELIVERY_OVER } from "@/lib/wilayas";
import { ButtonLink, IconButton } from "@/components/ui";

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

  return (
    <>
      <div
        onClick={closeCart}
        className={`fixed inset-0 z-50 bg-ink/30 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("cart.title")}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-canvas transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-hairline-soft px-6 py-4">
          <h2 className="text-base font-medium uppercase text-ink">
            {t("cart.count", { n: items.reduce((a, l) => a + l.qty, 0) })}
          </h2>
          <IconButton label={t("cart.close")} onClick={closeCart}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 6 L18 18 M18 6 L6 18" />
            </svg>
          </IconButton>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col justify-between px-6 py-8">
            <div>
              <h3 className="font-display text-3xl font-normal uppercase leading-[0.95] tracking-tight text-ink">
                {t("cart.emptyTitle")}
              </h3>
              <p className="mt-3 text-sm text-mute">{t("cart.emptyDesc")}</p>
            </div>
            <ButtonLinkWrapper href="/" onClick={closeCart}>
              {t("cart.viewCatalogue")}
            </ButtonLinkWrapper>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              <ul className="divide-y divide-hairline-soft">
                {items.map((line) => {
                  const product = getProduct(line.productId);
                  if (!product) return null;
                  return (
                    <li key={`${line.productId}-${line.size}`} className="flex gap-4 px-6 py-5">
                      {/* Cart thumbnail = product cover (imageUrls[0], slot ab-XX). See lib/mock.ts. */}
                      <Link
                        href={`/product/${product.id}`}
                        onClick={closeCart}
                        className="relative block h-24 w-24 shrink-0 overflow-hidden bg-soft-cloud"
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
                            <p className="truncate text-base font-medium text-ink">
                              {product.name}
                            </p>
                            <p className="mt-0.5 text-sm text-mute">
                              {product.sellerName} /{" "}
                              <span className="uppercase">{line.size}</span>
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => remove(line.productId, line.size)}
                            aria-label={`${t("cart.remove")} ${product.name}`}
                            className="press focus-kill text-xs font-medium text-mute underline underline-offset-2 transition-colors hover:text-ink"
                          >
                            {t("cart.remove")}
                          </button>
                        </div>
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex h-9 items-center rounded-lg border border-hairline">
                            <button
                              type="button"
                              aria-label="−"
                              onClick={() => setQty(line.productId, line.size, line.qty - 1)}
                              className="press focus-kill flex h-full w-8 items-center justify-center text-ink"
                            >
                              −
                            </button>
                            <span className="min-w-6 text-center text-sm tabular-nums">
                              {line.qty}
                            </span>
                            <button
                              type="button"
                              aria-label="+"
                              onClick={() => setQty(line.productId, line.size, line.qty + 1)}
                              className="press focus-kill flex h-full w-8 items-center justify-center text-ink"
                            >
                              +
                            </button>
                          </div>
                          <p className="text-sm font-medium tabular-nums text-ink">
                            {formatPrice(product.price * line.qty)}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="px-6 py-4">
                <button
                  type="button"
                  onClick={clear}
                  className="press focus-kill text-xs font-medium text-mute underline underline-offset-2 transition-colors hover:text-ink"
                >
                  {t("cart.emptyCart")}
                </button>
              </div>
            </div>

            <div className="border-t border-hairline-soft px-6 py-5">
              <div className="flex items-center justify-between text-base">
                <span className="font-medium uppercase text-ink">
                  {t("cart.subtotal")}
                </span>
                <span className="font-medium tabular-nums text-ink">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-5 text-mute">
                {deliveryFeeFor(subtotal) === 0
                  ? t("cart.freeDelivery")
                  : t("cart.deliveryHint", {
                      fee: formatPrice(deliveryFeeFor(subtotal)),
                      freeOver: formatPrice(FREE_DELIVERY_OVER),
                    })}
              </p>
              <ButtonLink
                href="/checkout"
                variant="primary"
                className="mt-4 w-full"
                onClick={closeCart}
              >
                {t("cart.checkout")}
              </ButtonLink>
              <Link
                href="/cart"
                onClick={closeCart}
                className="focus-kill mt-3 block text-center text-sm font-medium uppercase text-mute underline underline-offset-4 transition-colors hover:text-ink"
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

function ButtonLinkWrapper({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="press focus-kill inline-flex h-12 items-center justify-center rounded-lg bg-ink px-8 text-sm font-medium lowercase text-on-primary transition-colors hover:bg-charcoal"
    >
      {children}
    </Link>
  );
}