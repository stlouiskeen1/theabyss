"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { getProduct } from "@/lib/mock";
import { useAuth } from "@/lib/auth";
import { isSupabaseConfigured, supabaseClient } from "@/lib/supabase";
import type { Json } from "@/types/database.types";

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "in-transit"
  | "delivered"
  | "cancelled";

export type OrderItem = {
  productId: string;
  name: string;
  sellerId: string;
  sellerName: string;
  size: string;
  qty: number;
  price: number;
};

export type OrderCustomer = {
  name: string;
  phone: string;
  wilaya: number;
  commune: string;
  address: string;
};

export type Order = {
  id: string;
  ref: string;
  placedAt: number;
  customer: OrderCustomer;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  payment: "cod";
  status: OrderStatus;
  /** Cash-on-delivery amount collected by the courier, per the desk. */
  collected: boolean;
};

type NewOrder = Omit<Order, "id" | "ref" | "placedAt" | "status" | "collected">;

/** The COD fulfilment workflow. Cancelled is only reachable from the open states. */
export const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  placed: "confirmed",
  confirmed: "in-transit",
  "in-transit": "delivered",
  delivered: null,
  cancelled: null,
};

export const OPEN_STATUSES: OrderStatus[] = [
  "placed",
  "confirmed",
  "in-transit",
];

type OrdersContextValue = {
  orders: Order[];
  placeOrder: (input: NewOrder) => Promise<Order>;
  advance: (id: string) => Promise<void>;
  cancel: (id: string) => Promise<void>;
  markCollected: (id: string, collected: boolean) => Promise<void>;
  getOrder: (id: string) => Order | undefined;
};

const ORDERS_KEY = "abyss-orders";

const OrdersContext = createContext<OrdersContextValue | null>(null);

/* ---------------------------------------------------------------------------
 * Order engine.
 *
 * The server (Supabase) is the source of truth. Guest checkout goes straight
 * to the order_place RPC with the public anon key (the only anon-granted
 * order function). Desk mutations (advance / cancel / collect) are admin-only
 * and go through the Auth0-gated /api/ops route; account history through
 * /api/account/orders. Without Supabase keys the whole flow falls back to the
 * localStorage demo so the app still runs offline.
 * ------------------------------------------------------------------------- */

let storedOrders: Order[] = [];
let storedSeq = 0;
const listeners = new Set<() => void>();

function emit() {
  for (const cb of listeners) cb();
}

function readStored(): { orders: Order[]; seq: number } {
  if (typeof window === "undefined") return { orders: [], seq: 0 };
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) return { orders: [], seq: 0 };
    const parsed = JSON.parse(raw) as { orders?: Order[]; seq?: number };
    return {
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      seq: typeof parsed.seq === "number" ? parsed.seq : 0,
    };
  } catch {
    return { orders: [], seq: 0 };
  }
}

function hydrateOrders() {
  const { orders, seq } = readStored();
  storedOrders = orders;
  storedSeq = seq;
  emit();
}

function writeOrders(orders: Order[], seq: number) {
  storedOrders = orders;
  storedSeq = seq;
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify({ orders, seq }));
  } catch {
    /* storage unavailable */
  }
  emit();
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

const getSnapshot = () => storedOrders;
const getServerSnapshot = () => storedOrders;

/** The shape emitted by the database order RPCs (order_place / order_list_*). */
type DbItem = {
  sku: string;
  product_slug: string;
  product_name: string;
  vendor_id: string;
  vendor_name: string;
  size: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

type DbCustomer = {
  name: string | null;
  phone: string | null;
  wilaya_id: number | null;
  commune_name: string | null;
  address_line: string | null;
};

type DbOrder = {
  id: string;
  ref: string;
  status: OrderStatus;
  collected: boolean;
  payment_method: string;
  placed_at: number;
  subtotal: number;
  shipping_fee: number;
  total_amount: number;
  customer: DbCustomer | null;
  items: DbItem[];
};

/** Map a database order document to the storefront Order type. */
export function toOrder(from: Json): Order | null {
  const d = from as DbOrder;
  if (!d || typeof d.id !== "string" || !d.ref) return null;
  const c = d.customer;
  return {
    id: d.id,
    ref: d.ref,
    placedAt: typeof d.placed_at === "number" ? d.placed_at : Date.now(),
    customer: {
      name: c?.name ?? "",
      phone: c?.phone ?? "",
      wilaya: c?.wilaya_id ?? 0,
      commune: c?.commune_name ?? "",
      address: c?.address_line ?? "",
    },
    items: (d.items ?? []).map((i) => ({
      productId: i.product_slug,
      name: i.product_name,
      sellerId: i.vendor_id,
      sellerName: i.vendor_name,
      size: i.size,
      qty: i.quantity,
      price: Number(i.unit_price),
    })),
    subtotal: Number(d.subtotal),
    deliveryFee: Number(d.shipping_fee),
    total: Number(d.total_amount),
    payment: "cod",
    status: d.status,
    collected: d.collected,
  };
}

export function OrdersProvider({ children }: { children: ReactNode }) {
  const orders = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const configured = isSupabaseConfigured();
  const { user } = useAuth();

  useEffect(() => {
    hydrateOrders();
    const onStorage = (e: StorageEvent) => {
      if (e.key === ORDERS_KEY) hydrateOrders();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const placeOrder = useCallback(async (input: NewOrder): Promise<Order> => {
    const supabase = supabaseClient();
    if (!supabase) {
      const seq = storedSeq + 1;
      const order: Order = {
        ...input,
        id: `${Date.now().toString(36)}-${seq}`,
        ref: `DZ-${String(1000 + seq).slice(-4)}`,
        placedAt: Date.now(),
        status: "placed",
        collected: false,
      };
      writeOrders([order, ...storedOrders], seq);
      return order;
    }

    const { data, error } = await supabase.rpc("order_place", {
      p_items: input.items.map((i) => ({
        sku: `${i.productId}-${i.size.replace(/\s+/g, "").toUpperCase()}`,
        qty: i.qty,
      })),
      p_name: input.customer.name,
      p_phone: input.customer.phone,
      p_wilaya: input.customer.wilaya,
      p_commune: input.customer.commune,
      p_address: input.customer.address,
      p_shipping_fee: input.deliveryFee,
      p_payment_method: input.payment,
      p_auth0_sub: user?.id,
    });
    if (error) throw new Error(error.message);

    const order = toOrder(data as unknown as Json);
    if (!order) throw new Error("Unexpected server response");

    writeOrders([order, ...storedOrders], storedSeq);
    return order;
  }, [user]);

  const patch = useCallback((id: string, fn: (o: Order) => Order) => {
    writeOrders(storedOrders.map((o) => (o.id === id ? fn(o) : o)), storedSeq);
  }, []);

  /** Optimistic local update, then push the mutation through the admin route. */
  const deskAction = useCallback(
    async (id: string, fn: (o: Order) => Order, action: string, extra?: Record<string, unknown>) => {
      patch(id, fn);
      if (!configured) return;
      const res = await fetch("/api/ops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id, action, ...extra }),
      });
      if (!res.ok) throw new Error(`Desk request failed (${res.status})`);
    },
    [configured, patch]
  );

  const advance = useCallback(
    (id: string) =>
      deskAction(
        id,
        (o) => ({ ...o, status: NEXT_STATUS[o.status] ?? o.status }),
        "advance"
      ),
    [deskAction]
  );

  const cancel = useCallback(
    (id: string) =>
      deskAction(
        id,
        (o) => (o.status === "delivered" ? o : { ...o, status: "cancelled" }),
        "cancel"
      ),
    [deskAction]
  );

  const markCollected = useCallback(
    (id: string, collected: boolean) =>
      deskAction(id, (o) => ({ ...o, collected }), "collect", { collected }),
    [deskAction]
  );

  const getOrder = useCallback((id: string) => storedOrders.find((o) => o.id === id), []);

  const value = useMemo(
    () => ({ orders, placeOrder, advance, cancel, markCollected, getOrder }),
    [orders, placeOrder, advance, cancel, markCollected, getOrder]
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used within OrdersProvider");
  return ctx;
}

/** Snapshot an order item's merchandising details at the moment it was placed. */
export function buildOrderItems(
  lines: { productId: string; size: string; qty: number }[]
): OrderItem[] {
  return lines.flatMap((l) => {
    const p = getProduct(l.productId);
    if (!p) return [];
    return [
      {
        productId: p.id,
        name: p.name,
        sellerId: p.sellerId,
        sellerName: p.sellerName,
        size: l.size,
        qty: l.qty,
        price: p.price,
      },
    ];
  });
}