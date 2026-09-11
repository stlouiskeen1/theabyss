"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { useOrders } from "@/lib/orders";
import { formatPrice } from "@/lib/mock";
import { useWishlist } from "@/lib/wishlist";
import { ButtonLink } from "@/components/ui";

function Kicker({ label }: { label: string }) {
  return (
    <span className="font-label-caps text-label-caps text-primary uppercase flex items-center gap-unit-xs">
      <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
      {label}
    </span>
  );
}

function Module({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-unit-sm">
      <Kicker label={title} />
      {children}
    </div>
  );
}

export default function AccountView() {
  const { t } = useLang();
  const { user, signOut, loading } = useAuth();
  const { ids } = useWishlist();
  const { orders } = useOrders();
  const router = useRouter();

  // The session is fetched from `/auth/profile` right after mount (see
  // lib/auth). Once it settles, send logged-out visitors to the sign-in page.
  useEffect(() => {
    if (!loading && user === null) {
      router.replace("/account/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="min-h-[40vh]" />;
  }

  return (
    <div className="w-full px-margin-mobile md:px-margin-desktop py-unit-lg sm:py-unit-2xl">
      <div className="w-full max-w-2xl bg-surface-container-lowest rounded-xl shadow-xl p-unit-lg md:p-unit-2xl relative overflow-hidden mx-auto">
        {/* Progress strip */}
        <div className="absolute top-0 left-0 w-full h-1 bg-surface-container">
          <div className="h-full bg-primary transition-all duration-500 w-1/2"></div>
        </div>

        <div className="flex flex-col gap-unit-md mb-unit-xl">
          <div className="flex items-center justify-between gap-unit-md">
            <span className="font-label-caps text-label-caps text-text-muted tracking-widest uppercase">
              {t("account.kicker")}
            </span>
            <span className="font-mono-technical text-mono-technical px-unit-sm py-unit-2xs bg-surface-container rounded font-semibold text-primary whitespace-nowrap">
              {t("account.stamp")}
            </span>
          </div>
          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
              {t("account.welcomeTitle")}
            </h1>
            <p className="font-body-editorial text-body-editorial text-text-muted mt-unit-2xs">
              {user.name ?? user.email} · {user.email} · {t("home.authenticated")}
            </p>
          </div>
        </div>

        <form
          className="flex flex-col gap-unit-lg"
          onSubmit={(e) => e.preventDefault()}
        >
          {/* 01 · Member profile */}
          <Module title={t("account.memberTitle")}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-unit-md">
              <div className="flex flex-col gap-unit-2xs">
                <span className="font-label-caps-sm text-label-caps-sm text-text-muted uppercase">
                  {t("account.nameLabel")}
                </span>
                <span className="h-12 bg-surface-container-low text-primary px-unit-md rounded font-mono-technical text-mono-technical uppercase flex items-center">
                  {user.name ?? "—"}
                </span>
              </div>
              <div className="flex flex-col gap-unit-2xs">
                <span className="font-label-caps-sm text-label-caps-sm text-text-muted uppercase">
                  {t("auth.email")}
                </span>
                <span className="h-12 bg-surface-container-low text-primary px-unit-md rounded font-mono-technical text-mono-technical uppercase flex items-center truncate">
                  {user.email}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                signOut();
                router.replace("/");
              }}
              className="w-full h-12 bg-surface-paper text-primary ring-1 ring-border-rule hover:ring-primary hover:bg-surface-canvas rounded font-label-caps text-label-caps uppercase tracking-wider transition-all press focus-kill"
            >
              {t("auth.signOut")}
            </button>
          </Module>

          {/* 02 · Order tracking */}
          <Module title={t("account.ordersTitle")}>
            <div className="space-y-unit-2xs bg-surface-container-low/60 p-unit-md rounded-lg">
              <p className="font-body-utility text-body-utility text-primary font-medium">
                {t("account.orderPlaceholder")}
              </p>
            </div>
            {orders
              .filter(
                (o) =>
                  o.customer.name.toLowerCase() ===
                  (user?.name ?? "").trim().toLowerCase()
              )
              .map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between gap-unit-md border-b border-border-rule py-unit-sm"
                >
                  <div className="flex flex-col gap-unit-2xs">
                    <span className="font-mono-technical text-mono-technical font-bold uppercase text-primary">
                      {o.ref}
                    </span>
                    <span className="font-label-caps-sm text-label-caps-sm uppercase tracking-widest text-text-muted">
                      {t(`ops.status.${o.status}` as "ops.status.placed")} ·{" "}
                      {formatPrice(o.subtotal + o.deliveryFee)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-unit-2xs">
                    <span className="font-mono-technical text-mono-technical font-bold tabular-nums text-primary">
                      {formatPrice(o.total)}
                    </span>
                    <span className="font-label-caps-sm text-label-caps-sm uppercase tracking-widest text-text-muted">
                      {o.items.reduce((n, i) => n + i.qty, 0)}×
                    </span>
                  </div>
                </div>
              ))}
            <ButtonLink href="/category/all" variant="primary" className="w-full">
              {t("account.ordersCta")}
            </ButtonLink>
          </Module>

          {/* 03 · Saved objects */}
          <Module title={t("account.savedTitle")}>
            <div className="space-y-unit-2xs bg-surface-container-low/60 p-unit-md rounded-lg">
              <p className="font-body-utility text-body-utility text-primary font-medium">
                {t("account.savedNote")} ({ids.length})
              </p>
            </div>
            <ButtonLink
              href="/wishlist"
              variant="secondary"
              className="w-full"
            >
              {t("account.savedCta")}
            </ButtonLink>
          </Module>

          {/* 04 · Delivery coordinates */}
          <Module title={t("account.deliveryTitle")}>
            <div className="space-y-unit-2xs bg-surface-container-low/60 p-unit-md rounded-lg">
              <p className="font-mono-technical text-[11px] text-text-muted">
                {t("account.deliveryNote")}
              </p>
            </div>
            <ButtonLink href="/checkout" variant="primary" className="w-full">
              {t("account.setDelivery")}
            </ButtonLink>
          </Module>

          <div className="text-center pt-unit-xs">
            <Link
              href="/"
              className="font-mono-technical text-mono-technical text-text-muted hover:text-primary transition-colors uppercase tracking-wider"
            >
              {t("auth.shopNow")} →
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}