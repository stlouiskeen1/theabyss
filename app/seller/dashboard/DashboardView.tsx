"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { formatPrice } from "@/lib/mock";
import { Spinner } from "@/components/ui";

type Vendor = {
  id: string;
  name: string;
  slug: string;
  status: "pending" | "active" | "suspended";
  description?: string | null;
  created_at: string;
};

type VendorOrder = {
  id: string;
  status: string;
  subtotal: number;
  commission_amount: number;
  tracking_number?: string | null;
  created_at: string;
  order_id: string;
  order_ref?: string | null;
  order_status?: string | null;
  order_total?: number | null;
  payment_method?: string | null;
  items?: number | null;
};

type Payout = {
  id: string;
  amount: number;
  status: string;
  period_start?: string | null;
  period_end?: string | null;
  paid_at?: string | null;
};

export default function DashboardView() {
  const { t } = useLang();
  const { user, loading } = useAuth();
  const router = useRouter();

  const [vendors, setVendors] = useState<Vendor[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [orders, setOrders] = useState<VendorOrder[] | null>(null);
  const [payouts, setPayouts] = useState<Payout[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/account/login?next=/seller/dashboard");
  }, [user, loading, router]);

  const loadDetail = useCallback(async (vendorId: string) => {
    setOrders(null);
    setPayouts(null);
    try {
      const res = await fetch(`/api/seller/vendor?vendorId=${vendorId}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as { orders?: VendorOrder[]; payouts?: Payout[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? String(res.status));
      setOrders(data.orders ?? []);
      setPayouts(data.payouts ?? []);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await fetch("/api/seller/overview", { cache: "no-store" });
        const data = (await res.json()) as { vendors?: Vendor[]; error?: string };
        if (!res.ok) throw new Error(data.error ?? String(res.status));
        const list = data.vendors ?? [];
        setVendors(list);
        if (list.length > 0) {
          const first = list[0].id;
          setActiveId(first);
          void loadDetail(first);
        }
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, [user, loadDetail]);

  if (loading || !user) return <div className="min-h-[40vh]" />;

  const active = vendors?.find((v) => v.id === activeId) ?? null;
  const pendingTotal = (orders ?? []).reduce((n, o) => n + Number(o.subtotal ?? 0), 0);
  const commissionTotal = (orders ?? []).reduce((n, o) => n + Number(o.commission_amount ?? 0), 0);

  return (
    <div className="w-full px-margin-mobile md:px-margin-desktop py-unit-lg sm:py-unit-2xl">
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-unit-lg">
        <div>
          <span className="font-label-caps text-label-caps text-text-muted tracking-widest uppercase">
            {t("seller.desk.kicker")}
          </span>
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight mt-unit-2xs">
            {t("seller.desk.title")}
          </h1>
        </div>

        {error && (
          <p role="alert" className="font-mono-technical text-mono-technical text-accent-crimson">
            {error}
          </p>
        )}

        {!vendors ? (
          <div className="flex items-center gap-unit-sm text-text-muted">
            <Spinner /> <span className="font-mono-technical text-mono-technical">…</span>
          </div>
        ) : vendors.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl shadow-xl p-unit-lg md:p-unit-2xl text-center flex flex-col gap-unit-md">
            <p className="font-body-editorial text-body-editorial text-text-muted">
              {t("seller.desk.empty")}
            </p>
            <Link
              href="/seller/apply"
              className="inline-flex h-12 items-center justify-center bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-wider rounded shadow-md px-unit-lg"
            >
              {t("seller.desk.applyCta")}
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-unit-xs">
              {vendors.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setActiveId(v.id);
                    void loadDetail(v.id);
                  }}
                  className={`px-unit-md py-unit-sm rounded font-label-caps text-label-caps uppercase transition-all ${
                    v.id === activeId
                      ? "bg-surface-paper text-primary shadow-sm"
                      : "text-text-muted hover:text-primary"
                  }`}
                >
                  {v.name}
                </button>
              ))}
              <Link
                href="/seller/apply"
                className="px-unit-md py-unit-sm rounded font-label-caps text-label-caps uppercase text-text-muted hover:text-primary"
              >
                + {t("seller.desk.newShop")}
              </Link>
            </div>

            {active && (
              <div className="bg-surface-container-lowest rounded-xl shadow-xl p-unit-lg md:p-unit-2xl flex flex-col gap-unit-lg">
                <div className="flex items-center justify-between gap-unit-md flex-wrap">
                  <div>
                    <p className="font-headline-sm text-headline-sm text-primary uppercase">
                      {active.name}
                    </p>
                    <p className="font-mono-technical text-mono-technical text-text-muted">
                      /seller/{active.slug}
                    </p>
                  </div>
                  <span
                    className={`font-label-caps-sm text-label-caps-sm uppercase px-unit-sm py-unit-2xs rounded ${
                      active.status === "active"
                        ? "bg-status-cod/15 text-primary"
                        : active.status === "pending"
                          ? "bg-surface-container text-text-muted"
                          : "bg-accent-crimson/10 text-accent-crimson"
                    }`}
                  >
                    {t(`seller.desk.status.${active.status}` as "seller.desk.status.pending")}
                  </span>
                </div>

                {active.status === "pending" && (
                  <p className="font-body-utility text-body-utility text-text-muted">
                    {t("seller.desk.pendingNote")}
                  </p>
                )}

                <div className="grid grid-cols-3 gap-unit-sm">
                  <div className="bg-surface-container-low rounded p-unit-sm text-center">
                    <p className="font-mono-technical text-mono-technical font-bold text-primary">
                      {orders?.length ?? "…"}
                    </p>
                    <p className="font-label-caps-sm text-label-caps-sm uppercase text-text-muted">
                      {t("seller.desk.orders")}
                    </p>
                  </div>
                  <div className="bg-surface-container-low rounded p-unit-sm text-center">
                    <p className="font-mono-technical text-mono-technical font-bold text-primary">
                      {formatPrice(pendingTotal)}
                    </p>
                    <p className="font-label-caps-sm text-label-caps-sm uppercase text-text-muted">
                      {t("seller.desk.volume")}
                    </p>
                  </div>
                  <div className="bg-surface-container-low rounded p-unit-sm text-center">
                    <p className="font-mono-technical text-mono-technical font-bold text-primary">
                      {formatPrice(commissionTotal)}
                    </p>
                    <p className="font-label-caps-sm text-label-caps-sm uppercase text-text-muted">
                      {t("seller.desk.commission")}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="font-label-caps text-label-caps text-primary uppercase mb-unit-sm">
                    {t("seller.desk.recentOrders")}
                  </p>
                  {!orders ? (
                    <div className="flex items-center gap-unit-sm text-text-muted">
                      <Spinner />
                    </div>
                  ) : orders.length === 0 ? (
                    <p className="font-body-utility text-body-utility text-text-muted">
                      {t("seller.desk.noOrders")}
                    </p>
                  ) : (
                    <div className="flex flex-col">
                      {orders.slice(0, 20).map((o) => (
                        <div
                          key={o.id}
                          className="flex items-center justify-between gap-unit-md border-b border-border-rule py-unit-sm"
                        >
                          <div className="flex flex-col">
                            <span className="font-mono-technical text-mono-technical font-bold text-primary">
                              {o.order_ref ?? o.order_id.slice(0, 8)}
                            </span>
                            <span className="font-label-caps-sm text-label-caps-sm uppercase text-text-muted">
                              {o.status} · {o.items ?? 0}×
                            </span>
                          </div>
                          <span className="font-mono-technical text-mono-technical font-bold text-primary">
                            {formatPrice(Number(o.subtotal ?? 0))}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="font-label-caps text-label-caps text-primary uppercase mb-unit-sm">
                    {t("seller.desk.payouts")}
                  </p>
                  {!payouts ? (
                    <div className="flex items-center gap-unit-sm text-text-muted">
                      <Spinner />
                    </div>
                  ) : payouts.length === 0 ? (
                    <p className="font-body-utility text-body-utility text-text-muted">
                      {t("seller.desk.noPayouts")}
                    </p>
                  ) : (
                    <div className="flex flex-col">
                      {payouts.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between gap-unit-md border-b border-border-rule py-unit-sm"
                        >
                          <span className="font-label-caps-sm text-label-caps-sm uppercase text-text-muted">
                            {p.status}
                            {p.period_start ? ` · ${p.period_start} → ${p.period_end ?? "…"}` : ""}
                          </span>
                          <span className="font-mono-technical text-mono-technical font-bold text-primary">
                            {formatPrice(Number(p.amount ?? 0))}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
