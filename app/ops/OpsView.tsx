"use client";

import {
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useOrders, OPEN_STATUSES, type Order } from "@/lib/orders";
import { useLang } from "@/lib/i18n";
import { formatPrice } from "@/lib/mock";
import { wilayaName } from "@/lib/wilayas";
import { Button, LockIcon } from "@/components/ui";

const PASSCODE = "abyss";
const UNLOCKED_KEY = "abyss-ops-unlocked";

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

function OrderCard({ order, seq }: { order: Order; seq: number }) {
  const { t } = useLang();
  const { advance, cancel, markCollected } = useOrders();
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
            onClick={() => markCollected(order.id, !order.collected)}
            aria-pressed={order.collected}
            className={`press focus-kill h-11 whitespace-nowrap px-unit-md font-label-caps text-label-caps uppercase tracking-wider transition-colors ${
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
              className="h-11 flex-1 px-unit-md sm:flex-none"
              onClick={() => cancel(order.id)}
            >
              {t("ops.cancelOrder")}
            </Button>
            <Button
              type="button"
              variant="primary"
              className="h-11 flex-1 px-unit-md sm:flex-none"
              onClick={() => advance(order.id)}
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

export default function OpsView() {
  const { t } = useLang();
  const { orders } = useOrders();
  const [unlocked, setUnlocked] = useState(
    () => typeof window !== "undefined" && sessionStorage.getItem(UNLOCKED_KEY) === "1"
  );
  const [code, setCode] = useState("");
  const [denied, setDenied] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "collected">("all");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (code.trim().toLowerCase() === PASSCODE) {
      setDenied(false);
      setUnlocked(true);
      if (typeof window !== "undefined")
        sessionStorage.setItem(UNLOCKED_KEY, "1");
    } else {
      setDenied(true);
    }
  };

  const lock = () => {
    setUnlocked(false);
    setDenied(false);
    setCode("");
    if (typeof window !== "undefined")
      sessionStorage.removeItem(UNLOCKED_KEY);
  };

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
  const collected = orders
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
          {unlocked ? (
            <Button type="button" variant="ghost" className="h-11 px-unit-md" onClick={lock}>
              {t("ops.lock")}
            </Button>
          ) : null}
        </div>

        {!unlocked ? (
          <div className="flex flex-col gap-unit-md border border-border-rule bg-surface-container-low p-unit-xl">
            <div className="flex items-start gap-unit-md">
              <span className="mt-1 inline-flex h-9 w-9 items-center justify-center border border-border-rule bg-surface-paper text-primary">
                <LockIcon className="h-4 w-4" />
              </span>
              <div className="flex flex-col gap-unit-2xs">
                <h2 className="font-headline-sm text-headline-sm tracking-tight text-primary">
                  {t("ops.loginTitle")}
                </h2>
                <p className="font-body-editorial text-body-editorial text-text-muted max-w-xl">
                  {t("ops.loginBody")}
                </p>
              </div>
            </div>
            <form className="flex flex-col gap-unit-sm sm:max-w-sm" onSubmit={submit}>
              <label
                htmlFor="ops-passcode"
                className="font-label-caps-sm text-label-caps-sm uppercase tracking-widest text-text-muted"
              >
                {t("ops.passcodeLabel")}
              </label>
              <input
                id="ops-passcode"
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t("ops.passcodePlaceholder")}
                aria-invalid={denied}
                className={`h-12 bg-surface-paper px-unit-md font-mono-technical text-mono-technical uppercase text-primary focus:outline-none focus:bg-surface-container-high transition-colors ${
                  denied ? "ring-1 ring-accent-crimson" : "ring-1 ring-border-rule"
                }`}
              />
              {denied ? (
                <p className="font-label-caps-sm text-label-caps-sm uppercase tracking-widest text-accent-crimson">
                  {t("ops.denied")}
                </p>
              ) : (
                <p className="font-mono-technical text-mono-technical text-text-muted">
                  {t("ops.passHint")}
                </p>
              )}
              <Button type="submit" variant="primary">
                {t("ops.unlock")}
              </Button>
            </form>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-unit-sm lg:grid-cols-4">
              <Kpi label={t("ops.openOrders")} value={String(openCount)} />
              <Kpi label={t("ops.waitingDelivery")} value={String(inTransit)} />
              <Kpi label={t("ops.codVolume")} value={formatPrice(codVolume)} />
              <Kpi label={t("ops.collectedNow")} value={formatPrice(collected)} />
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
                  <OrderCard key={order.id} order={order} seq={i + 1} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}