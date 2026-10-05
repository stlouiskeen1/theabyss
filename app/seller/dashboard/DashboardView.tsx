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
  created_at: string;
};

type VendorOrder = {
  id: string;
  status: string;
  subtotal: number;
  commission_amount: number;
  created_at: string;
  order_id: string;
  order_ref?: string | null;
  items?: number | null;
};

type Payout = {
  id: string;
  amount: number;
  status: string;
  period_start?: string | null;
  period_end?: string | null;
};

type Variant = {
  id: string;
  size?: string | null;
  color?: string | null;
  sku?: string | null;
  price_override?: number | string | null;
  stock_quantity: number;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  brand?: string | null;
  base_price: number | string;
  status: "draft" | "active" | "archived";
  stock_total: number;
  sold_units: number;
  variants: Variant[];
  images: { id: string; url: string }[];
};

type Analytics = {
  totals: {
    suborders: number;
    units: number;
    revenue: number;
    commission: number;
    delivered: number;
    cancelled: number;
  };
  by_status: { status: string; count: number }[];
  daily: { day: string; revenue: number; units: number; orders: number }[];
  top_products: { name: string; units: number; revenue: number }[];
};

type Tab = "analytics" | "products" | "orders" | "payouts";

/** Parse an API response as JSON, even when the server answers HTML. */
async function readJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(`API error (${res.status}): ${text.slice(0, 140) || res.statusText}`);
  }
}

function slugify(v: string) {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const inputCls =
  "h-11 w-full bg-surface-container-low text-primary px-unit-md rounded font-mono-technical text-mono-technical placeholder:text-text-muted/60 focus:outline-none focus:ring-1 focus:ring-primary";
const labelCls =
  "font-label-caps-sm text-label-caps-sm text-text-muted uppercase tracking-widest";

export default function DashboardView() {
  const { t } = useLang();
  const { user, loading } = useAuth();
  const router = useRouter();

  const [vendors, setVendors] = useState<Vendor[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("analytics");
  const [error, setError] = useState<string | null>(null);

  const [orders, setOrders] = useState<VendorOrder[] | null>(null);
  const [payouts, setPayouts] = useState<Payout[] | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [days, setDays] = useState(30);

  const [editing, setEditing] = useState<Product | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/account/login?next=/seller/dashboard");
  }, [user, loading, router]);

  const loadDetail = useCallback(async (vendorId: string) => {
    setOrders(null);
    setPayouts(null);
    try {
      const res = await fetch(`/api/seller/vendor?vendorId=${vendorId}`, { cache: "no-store" });
      const data = (await readJson(res)) as { orders?: VendorOrder[]; payouts?: Payout[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? String(res.status));
      setOrders(data.orders ?? []);
      setPayouts(data.payouts ?? []);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const loadProducts = useCallback(async (vendorId: string) => {
    setProducts(null);
    try {
      const res = await fetch(`/api/seller/products?vendorId=${vendorId}`, { cache: "no-store" });
      const data = (await readJson(res)) as { products?: Product[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? String(res.status));
      setProducts(data.products ?? []);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const loadAnalytics = useCallback(async (vendorId: string, d: number) => {
    setAnalytics(null);
    try {
      const res = await fetch(`/api/seller/analytics?vendorId=${vendorId}&days=${d}`, {
        cache: "no-store",
      });
      const data = (await readJson(res)) as { analytics?: Analytics; error?: string };
      if (!res.ok) throw new Error(data.error ?? String(res.status));
      if (data.analytics) setAnalytics(data.analytics);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await fetch("/api/seller/overview", { cache: "no-store" });
        const data = (await readJson(res)) as { vendors?: Vendor[]; error?: string };
        if (!res.ok) throw new Error(data.error ?? String(res.status));
        const list = data.vendors ?? [];
        setVendors(list);
        if (list.length > 0) {
          const first = list[0].id;
          setActiveId(first);
          void loadDetail(first);
          void loadProducts(first);
          void loadAnalytics(first, 30);
        }
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, [user, loadDetail, loadProducts, loadAnalytics]);

  if (loading || !user) return <div className="min-h-[40vh]" />;

  const active = vendors?.find((v) => v.id === activeId) ?? null;

  const selectVendor = (id: string) => {
    setActiveId(id);
    setError(null);
    void loadDetail(id);
    void loadProducts(id);
    void loadAnalytics(id, days);
  };

  const refreshProducts = () => {
    if (activeId) void loadProducts(activeId);
  };

  return (
    <div className="w-full px-margin-mobile md:px-margin-desktop py-unit-lg sm:py-unit-2xl">
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-unit-lg">
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
                  onClick={() => selectVendor(v.id)}
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
              <>
                <div className="flex items-center justify-between gap-unit-md flex-wrap">
                  <p className="font-mono-technical text-mono-technical text-text-muted">
                    /seller/{active.slug}
                  </p>
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

                <div className="grid grid-cols-4 p-1 bg-surface-canvas rounded-lg">
                  {(["analytics", "products", "orders", "payouts"] as Tab[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setTab(k)}
                      className={`py-unit-sm px-unit-xs text-center rounded font-label-caps text-label-caps uppercase transition-all duration-200 ${
                        tab === k
                          ? "bg-surface-paper text-primary shadow-sm"
                          : "text-text-muted hover:text-primary"
                      }`}
                    >
                      {t(`seller.desk.tab.${k}` as "seller.desk.tab.analytics")}
                    </button>
                  ))}
                </div>

                {tab === "analytics" && (
                  <AnalyticsTab
                    analytics={analytics}
                    days={days}
                    onDays={(d) => {
                      setDays(d);
                      if (activeId) void loadAnalytics(activeId, d);
                    }}
                  />
                )}

                {tab === "products" && (
                  <ProductsTab
                    products={products}
                    editing={editing}
                    showNew={showNew}
                    formBusy={formBusy}
                    formError={formError}
                    activeVendorId={activeId!}
                    onNew={() => {
                      setEditing(null);
                      setFormError(null);
                      setShowNew(true);
                    }}
                    onEdit={(p) => {
                      setShowNew(false);
                      setFormError(null);
                      setEditing(p);
                    }}
                    onCloseForm={() => {
                      setShowNew(false);
                      setEditing(null);
                      setFormError(null);
                    }}
                    onSubmit={async (payload) => {
                      setFormBusy(true);
                      setFormError(null);
                      try {
                        const res = await fetch("/api/seller/products", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ ...payload, vendorId: activeId }),
                        });
                        const data = (await readJson(res)) as { error?: string };
                        if (!res.ok) throw new Error(data.error ?? String(res.status));
                        setShowNew(false);
                        setEditing(null);
                        refreshProducts();
                      } catch (e) {
                        setFormError((e as Error).message);
                      } finally {
                        setFormBusy(false);
                      }
                    }}
                    onArchive={async (p, hard) => {
                      try {
                        const res = await fetch("/api/seller/products", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            action: hard ? "delete" : "archive",
                            productId: p.id,
                          }),
                        });
                        const data = (await readJson(res)) as { error?: string };
                        if (!res.ok) throw new Error(data.error ?? String(res.status));
                        refreshProducts();
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                    onToggleActive={async (p) => {
                      try {
                        const res = await fetch("/api/seller/products", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            action: "update",
                            vendorId: activeId,
                            productId: p.id,
                            name: p.name,
                            slug: p.slug,
                            description: p.description,
                            basePrice: Number(p.base_price),
                            status: p.status === "active" ? "draft" : "active",
                          }),
                        });
                        const data = (await readJson(res)) as { error?: string };
                        if (!res.ok) throw new Error(data.error ?? String(res.status));
                        refreshProducts();
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                    onStock={async (variantId, stock) => {
                      try {
                        const res = await fetch("/api/seller/variants", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "setStock", variantId, stock }),
                        });
                        const data = (await readJson(res)) as { error?: string };
                        if (!res.ok) throw new Error(data.error ?? String(res.status));
                        refreshProducts();
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                    onVariantUpsert={async (productId, v) => {
                      try {
                        const res = await fetch("/api/seller/variants", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "upsert", productId, ...v }),
                        });
                        const data = (await readJson(res)) as { error?: string };
                        if (!res.ok) throw new Error(data.error ?? String(res.status));
                        refreshProducts();
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                    onVariantDelete={async (variantId) => {
                      try {
                        const res = await fetch("/api/seller/variants", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "delete", variantId }),
                        });
                        const data = (await readJson(res)) as { error?: string };
                        if (!res.ok) throw new Error(data.error ?? String(res.status));
                        refreshProducts();
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  />
                )}

                {tab === "orders" && <OrdersTab orders={orders} />}
                {tab === "payouts" && <PayoutsTab payouts={payouts} />}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- Analytics ---------------- */

function AnalyticsTab({
  analytics,
  days,
  onDays,
}: {
  analytics: Analytics | null;
  days: number;
  onDays: (d: number) => void;
}) {
  if (!analytics) {
    return (
      <div className="flex items-center gap-unit-sm text-text-muted">
        <Spinner />
      </div>
    );
  }
  const t0 = analytics.totals;
  const maxDay = Math.max(1, ...analytics.daily.map((d) => Number(d.revenue ?? 0)));
  const cards: [string, string][] = [
    [formatPrice(Number(t0.revenue ?? 0)), "Revenue"],
    [String(t0.units ?? 0), "Units sold"],
    [String(t0.suborders ?? 0), "Sub-orders"],
    [String(t0.delivered ?? 0), "Delivered"],
    [String(t0.cancelled ?? 0), "Cancelled"],
    [formatPrice(Number(t0.commission ?? 0)), "Commission"],
  ];
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-xl p-unit-lg md:p-unit-2xl flex flex-col gap-unit-lg">
      <div className="flex items-center justify-between flex-wrap gap-unit-sm">
        <p className="font-label-caps text-label-caps text-primary uppercase">Analytics</p>
        <div className="flex gap-unit-2xs">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onDays(d)}
              className={`px-unit-sm py-unit-2xs rounded font-mono-technical text-mono-technical ${
                days === d ? "bg-primary text-on-primary" : "bg-surface-container-low text-text-muted"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-unit-sm">
        {cards.map(([v, k]) => (
          <div key={k} className="bg-surface-container-low rounded p-unit-sm text-center">
            <p className="font-mono-technical text-mono-technical font-bold text-primary">{v}</p>
            <p className="font-label-caps-sm text-label-caps-sm uppercase text-text-muted">{k}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="font-label-caps text-label-caps text-primary uppercase mb-unit-sm">
          Daily revenue
        </p>
        {analytics.daily.length === 0 ? (
          <p className="font-body-utility text-body-utility text-text-muted">No sales in this period.</p>
        ) : (
          <div className="flex items-end gap-[3px] h-28">
            {analytics.daily.slice(-30).map((d) => (
              <div
                key={d.day}
                title={`${d.day}: ${formatPrice(Number(d.revenue ?? 0))} · ${d.units}u`}
                className="flex-1 bg-primary/80 rounded-t min-h-[3px]"
                style={{ height: `${Math.max(2, (Number(d.revenue ?? 0) / maxDay) * 100)}%` }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-unit-md">
        <div>
          <p className="font-label-caps text-label-caps text-primary uppercase mb-unit-sm">By status</p>
          {analytics.by_status.length === 0 ? (
            <p className="font-body-utility text-body-utility text-text-muted">—</p>
          ) : (
            analytics.by_status.map((s) => (
              <div key={s.status} className="flex items-center justify-between border-b border-border-rule py-unit-2xs">
                <span className="font-label-caps-sm text-label-caps-sm uppercase text-text-muted">
                  {s.status}
                </span>
                <span className="font-mono-technical text-mono-technical font-bold text-primary">
                  {s.count}
                </span>
              </div>
            ))
          )}
        </div>
        <div>
          <p className="font-label-caps text-label-caps text-primary uppercase mb-unit-sm">Top products</p>
          {analytics.top_products.length === 0 ? (
            <p className="font-body-utility text-body-utility text-text-muted">—</p>
          ) : (
            analytics.top_products.map((p) => (
              <div key={p.name} className="flex items-center justify-between border-b border-border-rule py-unit-2xs">
                <span className="font-body-utility text-body-utility text-primary truncate">{p.name}</span>
                <span className="font-mono-technical text-mono-technical font-bold text-primary whitespace-nowrap">
                  {p.units}u · {formatPrice(Number(p.revenue ?? 0))}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Products / stock ---------------- */

function ProductForm({
  initial,
  busy,
  error,
  onSubmit,
  onCancel,
}: {
  initial: Product | null;
  busy: boolean;
  error: string | null;
  onSubmit: (payload: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [touched, setTouched] = useState(!!initial);
  const [price, setPrice] = useState(String(initial?.base_price ?? ""));
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.images?.[0]?.url ?? "");
  const [status, setStatus] = useState(initial?.status ?? "draft");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          action: initial ? "update" : "create",
          productId: initial?.id,
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          brand: brand.trim() || null,
          basePrice: Number(price),
          status,
          imageUrl: imageUrl.trim() || null,
        });
      }}
      className="bg-surface-container-low rounded-lg p-unit-md flex flex-col gap-unit-sm"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-unit-sm">
        <label className="flex flex-col gap-unit-2xs">
          <span className={labelCls}>Name</span>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!touched) setSlug(slugify(e.target.value));
            }}
            className={inputCls}
            required
            maxLength={120}
          />
        </label>
        <label className="flex flex-col gap-unit-2xs">
          <span className={labelCls}>Slug</span>
          <input
            value={slug}
            onChange={(e) => {
              setTouched(true);
              setSlug(slugify(e.target.value));
            }}
            className={inputCls}
            required
          />
        </label>
        <label className="flex flex-col gap-unit-2xs">
          <span className={labelCls}>Price (DZD)</span>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            type="number"
            min={0}
            step="0.01"
            className={inputCls}
            required
          />
        </label>
        <label className="flex flex-col gap-unit-2xs">
          <span className={labelCls}>Brand</span>
          <input value={brand} onChange={(e) => setBrand(e.target.value)} className={inputCls} maxLength={80} />
        </label>
      </div>
      <label className="flex flex-col gap-unit-2xs">
        <span className={labelCls}>Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={5000}
          className="w-full bg-surface-container-low text-primary px-unit-md py-unit-sm rounded font-body-utility text-body-utility border border-border-rule focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-unit-sm">
        <label className="flex flex-col gap-unit-2xs">
          <span className={labelCls}>Image URL</span>
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className={inputCls} />
        </label>
        <label className="flex flex-col gap-unit-2xs">
          <span className={labelCls}>Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>
      {error && (
        <p role="alert" className="font-mono-technical text-mono-technical text-accent-crimson">
          {error}
        </p>
      )}
      <div className="flex gap-unit-sm">
        <button
          type="submit"
          disabled={busy}
          className="h-11 px-unit-lg bg-primary text-on-primary font-label-caps text-label-caps uppercase rounded disabled:opacity-60 flex items-center gap-unit-xs"
        >
          {busy ? <Spinner /> : null}
          <span>{initial ? "Save" : "Add product"}</span>
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-11 px-unit-lg font-label-caps text-label-caps uppercase text-text-muted hover:text-primary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function VariantRow({
  productId,
  variant,
  basePrice,
  onStock,
  onUpsert,
  onDelete,
}: {
  productId: string;
  variant: Variant;
  basePrice: number | string;
  onStock: (variantId: string, stock: number) => void;
  onUpsert: (productId: string, v: Record<string, unknown>) => void;
  onDelete: (variantId: string) => void;
}) {
  const [stock, setStock] = useState(String(variant.stock_quantity));
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState(variant.size ?? "");
  const [color, setColor] = useState(variant.color ?? "");
  const [price, setPrice] = useState(
    variant.price_override === null || variant.price_override === undefined
      ? ""
      : String(variant.price_override)
  );

  const priceShown =
    variant.price_override === null || variant.price_override === undefined
      ? Number(basePrice)
      : Number(variant.price_override);

  return (
    <div className="border-b border-border-rule py-unit-2xs">
      <div className="flex items-center gap-unit-sm flex-wrap">
        <span className="font-mono-technical text-mono-technical text-primary font-bold">
          {variant.size || "OS"}
          {variant.color ? ` / ${variant.color}` : ""}
        </span>
        <span className="font-mono-technical text-[11px] text-text-muted">{variant.sku}</span>
        <span className="font-mono-technical text-[11px] text-text-muted">{formatPrice(priceShown)}</span>
        <div className="ml-auto flex items-center gap-unit-2xs">
          <button
            type="button"
            onClick={() => onStock(variant.id, Math.max(0, variant.stock_quantity - 1))}
            className="w-8 h-8 rounded bg-surface-container-low font-bold text-primary"
            aria-label="Decrease stock"
          >
            −
          </button>
          <input
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            onBlur={() => {
              const n = Math.floor(Number(stock));
              if (Number.isInteger(n) && n >= 0 && n !== variant.stock_quantity) onStock(variant.id, n);
              else setStock(String(variant.stock_quantity));
            }}
            className="w-16 h-8 text-center bg-surface-container-low rounded font-mono-technical text-mono-technical text-primary"
            inputMode="numeric"
            aria-label="Stock quantity"
          />
          <button
            type="button"
            onClick={() => onStock(variant.id, variant.stock_quantity + 1)}
            className="w-8 h-8 rounded bg-surface-container-low font-bold text-primary"
            aria-label="Increase stock"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="font-mono-technical text-[11px] uppercase text-text-muted hover:text-primary px-unit-2xs"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Delete this variant?")) onDelete(variant.id);
            }}
            className="font-mono-technical text-[11px] uppercase text-accent-crimson/80 hover:text-accent-crimson px-unit-2xs"
          >
            Del
          </button>
        </div>
      </div>
      {open && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onUpsert(productId, {
              variantId: variant.id,
              size: size.trim() || null,
              color: color.trim() || null,
              priceOverride: price === "" ? null : Number(price),
            });
            setOpen(false);
          }}
          className="grid grid-cols-3 gap-unit-2xs mt-unit-2xs"
        >
          <input value={size} onChange={(e) => setSize(e.target.value)} placeholder="Size" className={inputCls} />
          <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="Color" className={inputCls} />
          <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price override" type="number" min={0} step="0.01" className={inputCls} />
          <button type="submit" className="h-11 col-span-3 bg-primary text-on-primary font-label-caps text-label-caps uppercase rounded">
            Save variant
          </button>
        </form>
      )}
    </div>
  );
}

function AddVariant({ productId, onUpsert }: { productId: string; onUpsert: (productId: string, v: Record<string, unknown>) => void }) {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [stock, setStock] = useState("0");
  const [price, setPrice] = useState("");
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-unit-2xs font-mono-technical text-[11px] uppercase text-text-muted hover:text-primary"
      >
        + Add variant
      </button>
    );
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onUpsert(productId, {
          size: size.trim() || null,
          color: color.trim() || null,
          stockQuantity: Math.max(0, Math.floor(Number(stock)) || 0),
          priceOverride: price === "" ? null : Number(price),
        });
        setOpen(false);
        setSize("");
        setColor("");
        setStock("0");
        setPrice("");
      }}
      className="grid grid-cols-2 sm:grid-cols-4 gap-unit-2xs mt-unit-2xs"
    >
      <input value={size} onChange={(e) => setSize(e.target.value)} placeholder="Size" className={inputCls} />
      <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="Color" className={inputCls} />
      <input value={stock} onChange={(e) => setStock(e.target.value)} placeholder="Stock" type="number" min={0} step={1} className={inputCls} />
      <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price override" type="number" min={0} step="0.01" className={inputCls} />
      <button type="submit" className="h-11 col-span-2 sm:col-span-4 bg-primary text-on-primary font-label-caps text-label-caps uppercase rounded">
        Add variant
      </button>
    </form>
  );
}

function ProductsTab(props: {
  products: Product[] | null;
  editing: Product | null;
  showNew: boolean;
  formBusy: boolean;
  formError: string | null;
  activeVendorId: string;
  onNew: () => void;
  onEdit: (p: Product) => void;
  onCloseForm: () => void;
  onSubmit: (payload: Record<string, unknown>) => void;
  onArchive: (p: Product, hard: boolean) => void;
  onToggleActive: (p: Product) => void;
  onStock: (variantId: string, stock: number) => void;
  onVariantUpsert: (productId: string, v: Record<string, unknown>) => void;
  onVariantDelete: (variantId: string) => void;
}) {
  const { products } = props;
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!products) {
    return (
      <div className="flex items-center gap-unit-sm text-text-muted">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-xl p-unit-lg md:p-unit-2xl flex flex-col gap-unit-md">
      <div className="flex items-center justify-between flex-wrap gap-unit-sm">
        <p className="font-label-caps text-label-caps text-primary uppercase">
          Stock · {products.length} products
        </p>
        <button
          type="button"
          onClick={props.onNew}
          className="h-11 px-unit-lg bg-primary text-on-primary font-label-caps text-label-caps uppercase rounded"
        >
          + Add product
        </button>
      </div>

      {props.showNew && (
        <ProductForm
          initial={null}
          busy={props.formBusy}
          error={props.formError}
          onSubmit={props.onSubmit}
          onCancel={props.onCloseForm}
        />
      )}
      {props.editing && (
        <ProductForm
          initial={props.editing}
          busy={props.formBusy}
          error={props.formError}
          onSubmit={props.onSubmit}
          onCancel={props.onCloseForm}
        />
      )}

      {products.length === 0 ? (
        <p className="font-body-utility text-body-utility text-text-muted">
          No products yet — add your first one above.
        </p>
      ) : (
        products.map((p) => (
          <div key={p.id} className="border border-border-rule rounded-lg p-unit-sm">
            <div className="flex items-center gap-unit-sm flex-wrap">
              <div className="flex flex-col">
                <span className="font-body-utility text-body-utility font-medium text-primary">
                  {p.name}
                </span>
                <span className="font-mono-technical text-[11px] text-text-muted">
                  {formatPrice(Number(p.base_price))} · {p.sold_units}u sold · {p.stock_total} in stock · {p.status}
                </span>
              </div>
              <div className="ml-auto flex items-center gap-unit-2xs flex-wrap">
                <button
                  type="button"
                  onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                  className="font-mono-technical text-[11px] uppercase text-text-muted hover:text-primary px-unit-2xs"
                >
                  {expanded === p.id ? "Hide stock" : "Stock"}
                </button>
                <button
                  type="button"
                  onClick={() => props.onEdit(p)}
                  className="font-mono-technical text-[11px] uppercase text-text-muted hover:text-primary px-unit-2xs"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => props.onToggleActive(p)}
                  className="font-mono-technical text-[11px] uppercase text-text-muted hover:text-primary px-unit-2xs"
                >
                  {p.status === "active" ? "Unpublish" : "Publish"}
                </button>
                {p.status === "archived" ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Permanently delete? Only possible if it never sold.")) props.onArchive(p, true);
                    }}
                    className="font-mono-technical text-[11px] uppercase text-accent-crimson/80 hover:text-accent-crimson px-unit-2xs"
                  >
                    Delete
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => props.onArchive(p, false)}
                    className="font-mono-technical text-[11px] uppercase text-text-muted hover:text-primary px-unit-2xs"
                  >
                    Archive
                  </button>
                )}
              </div>
            </div>
            {expanded === p.id && (
              <div className="mt-unit-2xs">
                {p.variants.map((v) => (
                  <VariantRow
                    key={v.id}
                    productId={p.id}
                    variant={v}
                    basePrice={p.base_price}
                    onStock={props.onStock}
                    onUpsert={props.onVariantUpsert}
                    onDelete={props.onVariantDelete}
                  />
                ))}
                <AddVariant productId={p.id} onUpsert={props.onVariantUpsert} />
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

/* ---------------- Orders / payouts ---------------- */

function OrdersTab({ orders }: { orders: VendorOrder[] | null }) {
  if (!orders) {
    return (
      <div className="flex items-center gap-unit-sm text-text-muted">
        <Spinner />
      </div>
    );
  }
  if (orders.length === 0) {
    return (
      <p className="font-body-utility text-body-utility text-text-muted">No orders yet for this boutique.</p>
    );
  }
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-xl p-unit-lg md:p-unit-2xl flex flex-col">
      {orders.slice(0, 50).map((o) => (
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
  );
}

function PayoutsTab({ payouts }: { payouts: Payout[] | null }) {
  if (!payouts) {
    return (
      <div className="flex items-center gap-unit-sm text-text-muted">
        <Spinner />
      </div>
    );
  }
  if (payouts.length === 0) {
    return <p className="font-body-utility text-body-utility text-text-muted">No payouts yet.</p>;
  }
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-xl p-unit-lg md:p-unit-2xl flex flex-col">
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
  );
}
