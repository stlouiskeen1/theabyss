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

type WishlistContextValue = {
  ids: string[];
  toggle: (productId: string) => void;
  has: (productId: string) => boolean;
  clear: () => void;
};

const STORAGE_KEY = "abyss-wishlist";

const WishlistContext = createContext<WishlistContextValue | null>(null);

/*
 * Mirrors the cart's external store so the wishlist hydrates from localStorage
 * after mount (SSR renders the empty heart; the saved ids arrive client-side,
 * cross-tab). ids is the set of saved product ids, kept in insertion order.
 */
let storedIds: string[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const cb of listeners) cb();
}

function readStored(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id) => typeof id === "string");
  } catch {
    return [];
  }
}

function hydrate() {
  storedIds = readStored();
  emit();
}

function write(next: string[]) {
  storedIds = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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

const getSnapshot = () => storedIds;
const getServerSnapshot = () => storedIds;

export function WishlistProvider({ children }: { children: ReactNode }) {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    hydrate();
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) hydrate();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const has = useCallback(
    (productId: string) => ids.includes(productId),
    [ids]
  );

  const toggle = useCallback((productId: string) => {
    write(
      storedIds.includes(productId)
        ? storedIds.filter((id) => id !== productId)
        : [...storedIds, productId]
    );
  }, []);

  const clear = useCallback(() => write([]), []);

  const value = useMemo(
    () => ({ ids, toggle, has, clear }),
    [ids, toggle, has, clear]
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
