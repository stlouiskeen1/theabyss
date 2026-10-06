"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  useState,
  type ReactNode,
} from "react";
import { getProduct } from "@/lib/mock";

export type CartLine = {
  productId: string;
  size: string;
  qty: number;
  /** Live-catalog snapshot: real variant SKU + display data for live products. */
  sku?: string;
  price?: number;
  name?: string;
  image?: string;
  sellerName?: string;
};

export type CartSnapshot = {
  sku?: string;
  price?: number;
  name?: string;
  image?: string;
  sellerName?: string;
};

type CartContextValue = {
  open: boolean;
  openCart: () => void;
  closeCart: () => void;
  items: CartLine[];
  add: (productId: string, size: string, qty?: number, snap?: CartSnapshot) => void;
  setQty: (productId: string, size: string, qty: number) => void;
  remove: (productId: string, size: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const CART_KEY = "abyss-cart";

const CartContext = createContext<CartContextValue | null>(null);

/*
 * The cart lives in a tiny external store so it can be hydrated from
 * localStorage without a server/client mismatch (SSR always renders the empty
 * bag; the stored cart arrives right after mount, on all open tabs).
 */
let storedItems: CartLine[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const cb of listeners) cb();
}

function readStored(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (l) =>
          l &&
          typeof l.productId === "string" &&
          typeof l.size === "string" &&
          typeof l.qty === "number" &&
          l.qty > 0 &&
          // Drop orphaned live lines saved before snapshots existed.
          (typeof l.productId !== "string" ||
            !l.productId.startsWith("live:") ||
            typeof l.price === "number")
      )
      .map((l) => ({
        productId: l.productId,
        size: l.size,
        qty: Math.min(9, Math.floor(l.qty)),
        ...(typeof l.sku === "string" ? { sku: l.sku } : null),
        ...(typeof l.price === "number" ? { price: l.price } : null),
        ...(typeof l.name === "string" ? { name: l.name } : null),
        ...(typeof l.image === "string" ? { image: l.image } : null),
        ...(typeof l.sellerName === "string" ? { sellerName: l.sellerName } : null),
      }));
  } catch {
    return [];
  }
}

function hydrateCart() {
  storedItems = readStored();
  emit();
}

function writeCart(next: CartLine[]) {
  storedItems = next;
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(next));
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

const getSnapshot = () => storedItems;
const getServerSnapshot = () => storedItems;

export function CartProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    hydrateCart();
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_KEY) hydrateCart();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const openCart = useCallback(() => setOpen(true), []);
  const closeCart = useCallback(() => setOpen(false), []);

  const add = useCallback(
    (productId: string, size: string, qty = 1, snap?: CartSnapshot) => {
      const existing = storedItems.find(
        (l) => l.productId === productId && l.size === size
      );
      if (existing) {
        writeCart(
          storedItems.map((l) =>
            l.productId === productId && l.size === size
              ? { ...l, ...snap, qty: Math.min(9, l.qty + qty) }
              : l
          )
        );
      } else {
        writeCart([
          ...storedItems,
          { productId, size, qty: Math.min(9, qty), ...snap },
        ]);
      }
      setOpen(true);
    },
    []
  );

  const setQty = useCallback(
    (productId: string, size: string, qty: number) => {
      writeCart(
        storedItems
          .map((l) =>
            l.productId === productId && l.size === size
              ? { ...l, qty: Math.max(0, Math.min(9, qty)) }
              : l
          )
          .filter((l) => l.qty > 0)
      );
    },
    []
  );

  const remove = useCallback((productId: string, size: string) => {
    writeCart(
      storedItems.filter(
        (l) => l.productId !== productId || l.size !== size
      )
    );
  }, []);

  const clear = useCallback(() => writeCart([]), []);

  const count = useMemo(
    () => items.reduce((acc, l) => acc + l.qty, 0),
    [items]
  );

  const subtotal = useMemo(
    () =>
      items.reduce((acc, l) => {
        if (typeof l.price === "number") return acc + l.price * l.qty;
        const p = getProduct(l.productId);
        return acc + (p ? p.price * l.qty : 0);
      }, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      open,
      openCart,
      closeCart,
      items,
      add,
      setQty,
      remove,
      clear,
      count,
      subtotal,
    }),
    [open, openCart, closeCart, items, add, setQty, remove, clear, count, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

/** Display data for a cart line: mock lookup first, live snapshot fallback. */
export function lineDisplay(line: CartLine): {
  id: string;
  name: string;
  price: number;
  image: string;
  sellerName: string;
} | null {
  const p = getProduct(line.productId);
  if (p) {
    return {
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.imageUrls[0],
      sellerName: p.sellerName,
    };
  }
  if (typeof line.name === "string" && typeof line.price === "number") {
    return {
      id: line.productId,
      name: line.name,
      price: line.price,
      image: line.image ?? "",
      sellerName: line.sellerName ?? "",
    };
  }
  return null;
}