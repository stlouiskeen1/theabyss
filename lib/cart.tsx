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
};

type CartContextValue = {
  open: boolean;
  openCart: () => void;
  closeCart: () => void;
  items: CartLine[];
  add: (productId: string, size: string, qty?: number) => void;
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
    return parsed.filter(
      (l) =>
        l &&
        typeof l.productId === "string" &&
        typeof l.size === "string" &&
        typeof l.qty === "number" &&
        l.qty > 0
    );
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

  const add = useCallback((productId: string, size: string, qty = 1) => {
    const existing = storedItems.find(
      (l) => l.productId === productId && l.size === size
    );
    if (existing) {
      writeCart(
        storedItems.map((l) =>
          l.productId === productId && l.size === size
            ? { ...l, qty: Math.min(9, l.qty + qty) }
            : l
        )
      );
    } else {
      writeCart([...storedItems, { productId, size, qty: Math.min(9, qty) }]);
    }
    setOpen(true);
  }, []);

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