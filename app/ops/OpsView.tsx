"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useOrders, OPEN_STATUSES, toOrder, type Order } from "@/lib/orders";
import { useLang } from "@/lib/i18n";
import { formatPrice } from "@/lib/mock";
import { wilayaName } from "@/lib/wilayas";
import { Button, ButtonLink } from "@/components/ui";
import type { Json } from "@/types/database.types";

function Kicker({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-unit-xs font-label-caps text-label-caps uppercase text-primary">
      <span className="h-1.5 w-1.5 bg-accent-crimson" />
      <span className="flex items-center gap-unit-xs">
        {label}
      </span>
    </span>
  );
}

function StatusChip({ status, collected }: { status: Order["status"]; collected: boolean }) {
  const { t } = useLang();
  const tone =
    status === "cancelled"
      ? "bg-accent-crimson text-surface-canvas"
      : status === "delivered"
        ? "bg-status-cod text-surface-canvas"
        : collected
          ? "bg-primary text-surface-canvas"
          : "bg-surface-container-high text-primary";
  const label =
    status === "delivered" && collected
      ? `${t(`ops.status.${status}` as "ops.status.placed")} · ${t("ops.collected")}`
      : t(`ops.status.${status}` as "ops.status.placed");
  return (
    <span className={`whitespace-nowrap px-unit-sm py-unit-2xs font-label-caps-sm text-label-caps-sm uppercase tracking-widest ${tone}`}>
      {label}
    </span>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-unit-2xs border border-border-rule bg-surface-container-low p-unit-md">
      <span className="font-label-caps-sm text-label-caps-sm uppercase tracking-widest text-text-muted">
        {label}
      </span>
      <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-primary tabular-nums">
        {value}
      </span>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-unit-2xs">
      <span className="font-label-caps-sm text-label-caps-sm uppercase tracking-widest text-text-muted">
        {label}
      </span>
      {children}
    </div>
  );
}

function OrderCard({
  order,
  seq,
  busy,
  onAdvance,
  onCancel,
  onCollect,
}: {
  order: Order;
  seq: number;
  busy: boolean;
  onAdvance: () => void;
  onCancel: () => void;
  onCollect: () => void;
}) {
  const { t } = useLang();
  const open = OPEN_STATUSES.includes(order.status);

  const bundles = order.items.reduce<
    Record<string, { sellerName: string; items: Order["items"] }>
  >((map, item) => {
    if (!map[item.sellerId]) {
      map[item.sellerId] = { sellerName: item.sellerName, items: [] };
    }
    map[item.sellerId].items.push(item);
    return map;
  }, {});

  return (
    <article className="flex flex-col gap-unit-md border border-border-rule bg-surface-container-low p-unit-md sm:p-unit-xl">
      <div className="flex flex-wrap items-center justify-between gap-unit-md">
        <div className="flex flex-col gap-unit-2xs">
          <span className="font-mono-technical text-[11px] uppercase tracking-widest text-text-muted">
            {t("ops.cabinLabel", { seq: String(seq).padStart(2, "0") })} ·{" "}
            {t("ops.ref")} {order.ref}
          </span>
          <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-primary">
            {order.customer.name}
          </span>
        </div>
        <StatusChip status={order.status} collected={order.collected} />
      </div>

      <div className="grid grid-cols-1 gap-unit-md sm:grid-cols-2">
        <Row label={t("ops.placedAt")}>
          <span className="font-body-utility text-body-utility text-primary">
            {new Date(order.placedAt).toLocaleString()}
          </span>
        </Row>
        <Row label={t("ops.phone")}>
          <a
            href={`tel:${order.customer.phone.replace(/\s/g, "")}`}
            className="w-fit font-mono-technical text-mono-technical font-bold text-primary underline-offset-4 hover:underline"
          >
            {order.customer.phone}
          </a>
        </Row>
        <Row label={t("ops.destination")}>
          <span className="font-body-utility text-body-utility text-primary">
            {wilayaName(order.customer.wilaya) ?? order.customer.wilaya} ·{" "}
            {order.customer.commune}
          </span>
        </Row>
        <Row label={t("ops.customer")}>
          <span className="font-body-utility text-body-utility text-primary break-words">
            {order.customer.address}
          </span>
        </Row>
      </div>

      <div className="flex flex-col gap-unit-md">
        {Object.entries(bundles).map(([sellerId, bundle]) => (
          <div key={sellerId} className="border-t border-border-rule pt-unit-md">
            <span className="mb-unit-xs block font-label-caps text-label-caps uppercase tracking-wider text-primary">
              {bundle.sellerName}
            </span>
            {bundle.items.map((item, i) => (
              <div
                key={`${item.productId}-${item.size}-${i}`}
                className="flex items-baseline justify-between gap-unit-md py-unit-2xs"
              >
                <span className="font-body-utility text-body-utility text-primary">
                  {item.name} · {item.size}{" "}
                  <span className="text-text-muted">×{item.qty}</span>
                </span>
                <span className="whitespace-nowrap font-mono-technical text-mono-technical tabular-nums text-primary">
                  {formatPrice(item.price * item.qty)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-unit-xs border-t border-border-rule pt-unit-md">
        <div className="flex items-baseline justify-between">
          <span className="font-label-caps-sm text-label-caps-sm uppercase tracking-widest text-text-muted">
            {t("ops.subtotal")}
          </span>
          <span className="font-mono-technical text-mono-technical tabular-nums text-primary">
            {formatPrice(order.subtotal)}
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="font-label-caps-sm text-label-caps-sm uppercase tracking-widest text-text-muted">
            {t("ops.delivery")}
          </span>
          <span className="font-mono-technical text-mono-technical tabular-nums text-primary">
            {order.deliveryFee ? formatPrice(order.deliveryFee) : "0 DZD"}
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-primary">
            {t("ops.total")}
          </span>
          <span className="font-mono-technical text-mono-technical font-bold tabular-nums text-primary">
            {formatPrice(order.total)}
          </span>
        </div>
      </div>

      {open ? (
        <div className="flex flex-col gap-unit-xs border-t border-border-rule pt-unit-md sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            disabled={busy}
            onClick={onCollect}
            aria-pressed={order.collected}
            className={`press focus-kill h-11 whitespace-nowrap px-unit-md font-label-caps text-label-caps uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              order.collected
                ? "bg-status-cod text-surface-canvas"
                : "bg-surface-paper text-primary ring-1 ring-border-rule hover:ring-primary"
            }`}
          >
            {order.collected ? t("ops.collected") : t("ops.notCollected")}
          </button>
          <div className="flex gap-unit-xs">
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              className="h-11 flex-1 px-unit-md sm:flex-none"
              onClick={onCancel}
            >
              {t("ops.cancelOrder")}
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={busy}
              className="h-11 flex-1 px-unit-md sm:flex-none"
              onClick={onAdvance}
            >
              {t("ops.advance")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-t border-border-rule pt-unit-md">
          <p className="font-label-caps text-label-caps uppercase tracking-wider text-text-muted">
            {order.status === "delivered"
              ? t("ops.deliveredTag")
              : t("ops.cancelledTag")}
          </p>
        </div>
      )}
    </article>
  );
}

type DeskState =
  | { kind: "loading" }
  | { kind: "error"; status: number; message: string }
  | { kind: "ready"; orders: Order[] };

export default function OpsView() {
  const { t } = useLang();
  const { orders: localOrders, advance, cancel, markCollected } = useOrders();
  const [state, setState] = useState<DeskState>({ kind: "loading" });
  const [filter, setFilter] = useState<"all" | "open" | "collected">("all");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/ops", { cache: "no-store" });
      if (!res.ok) {
        let message = `HTTP ${res.status}`;
        try {
          const body = (await res.json()) as { error?: string };
          if (body?.error) message = body.error;
        } catch {
          /* keep fallback message */
        }
        setState({ kind: "error", status: res.status, message });
        return;
      }
      const data = (await res.json()) as Json[];
      const list = data
        .map(toOrder)
        .filter((o): o is Order => o !== null);
      setState({ kind: "ready", orders: list });
    } catch (e) {
      setState({ kind: "error", status: 0, message: (e as Error).message });
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const run = useCallback(
    async (fn: () => Promise<void>) => {
      if (busy) return;
      setBusy(true);
      try {
        await fn();
        await load();
      } finally {
        setBusy(false);
      }
    },
    [busy, load]
  );

  if (state.kind === "error") {
    const body =
      state.status === 403
        ? t("ops.notAdmin")
        : `${t("ops.adminsOnly")} — ${state.message}`;
    return (
      <div className="w-full px-margin-mobile py-unit-lg sm:px-margin-desktop sm:py-unit-2xl">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-unit-md border border-border-rule bg-surface-container-low p-unit-xl">
          <Kicker label={t("ops.kicker")} />
          <h1 className="font-headline-lg text-headline-lg tracking-tight text-primary">
            {t("ops.title")}
          </h1>
          <p className="font-body-editorial text-body-editorial text-text-muted max-w-xl">
            {body}
          </p>
          <div className="flex flex-wrap gap-unit-xs pt-unit-sm">
            {state.status === 401 ? (
              <ButtonLink href="/account/login" variant="primary">
                {t("ops.signIn")}
              </ButtonLink>
            ) : (
              <Button type="button" variant="primary" onClick={() => void load()}>
                {t("ops.retry")}
              </Button>
            )}
            <ButtonLink href="/" variant="ghost">
              {t("ops.backToStore")} →
            </ButtonLink>
          </div>
        </div>
      </div>
    );
  }

  if (state.kind === "loading") {
    return (
      <div className="w-full px-margin-mobile py-unit-lg sm:px-margin-desktop sm:py-unit-2xl">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-unit-lg">
          <div className="border-b border-border-rule pb-unit-lg">
            <Kicker label={t("ops.kicker")} />
            <h1 className="font-headline-lg text-headline-lg tracking-tight text-primary">
              {t("ops.title")}
            </h1>
            <p className="font-body-editorial text-body-editorial text-text-muted">
              {t("ops.loading")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const orders = state.orders.length > 0 ? state.orders : localOrders;

  const visible = orders.filter((o) => {
    if (filter === "open") return OPEN_STATUSES.includes(o.status);
    if (filter === "collected") return o.collected;
    return true;
  });

  const openCount = orders.filter((o) => OPEN_STATUSES.includes(o.status)).length;
  const inTransit = orders.filter((o) => o.status === "in-transit").length;
  const codVolume = orders
    .filter((o) => OPEN_STATUSES.includes(o.status))
    .reduce((sum, o) => sum + o.total, 0);
  const collectedTotal = orders
    .filter((o) => o.collected)
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="w-full px-margin-mobile py-unit-lg sm:px-margin-desktop sm:py-unit-2xl">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-unit-lg">
        <div className="flex flex-wrap items-end justify-between gap-unit-md border-b border-border-rule pb-unit-lg">
          <div className="flex flex-col gap-unit-2xs">
            <Kicker label={t("ops.kicker")} />
            <h1 className="font-headline-lg text-headline-lg tracking-tight text-primary">
              {t("ops.title")}
            </h1>
            <p className="font-body-editorial text-body-editorial text-text-muted">
              {t("ops.subtitle", { n: String(openCount) })}
            </p>
          </div>
          <Button type="button" variant="ghost" className="h-11 px-unit-md" onClick={() => void load()}>
            {t("ops.refresh")}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-unit-sm lg:grid-cols-4">
          <Kpi label={t("ops.openOrders")} value={String(openCount)} />
          <Kpi label={t("ops.waitingDelivery")} value={String(inTransit)} />
          <Kpi label={t("ops.codVolume")} value={formatPrice(codVolume)} />
          <Kpi label={t("ops.collectedNow")} value={formatPrice(collectedTotal)} />
        </div>

        <div className="flex flex-wrap gap-unit-xs">
          {(
            [
              ["all", t("ops.placedAll")],
              ["open", t("ops.filterOpen")],
              ["collected", t("ops.filterCollected")],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
              className={`press focus-kill h-10 whitespace-nowrap px-unit-md font-label-caps text-label-caps uppercase tracking-wider transition-colors ${
                filter === key
                  ? "bg-border-dark text-surface-paper"
                  : "bg-surface-paper text-primary ring-1 ring-border-rule hover:bg-surface-container-high"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="flex flex-col gap-unit-md border border-border-rule bg-surface-container-low p-unit-xl">
            <p className="font-headline-sm text-headline-sm tracking-tight text-primary">
              {t("ops.empty")}
            </p>
            <Link
              href="/"
              className="font-label-caps text-label-caps uppercase tracking-wider text-primary underline underline-offset-4"
            >
              {t("ops.backToStore")} →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-unit-md">
            {visible.map((order, i) => (
              <OrderCard
                key={order.id}
                order={order}
                seq={i + 1}
                busy={busy}
                onAdvance={() => void run(() => advance(order.id))}
                onCancel={() => void run(() => cancel(order.id))}
                onCollect={() => void run(() => markCollected(order.id, !order.collected))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
