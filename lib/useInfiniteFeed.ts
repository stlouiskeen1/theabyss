"use client";

// ============================================================================
// useInfiniteFeed — cosmos.so infinite-scroll trigger, ported.
//
// From REA ev_47d8512f3eeedae1… (chunk 0yjkmb0dp3sir.js), trigger `H`:
//   • fire when the end of loaded data is within `18 × lanes` of the
//     viewport (we take `lookaheadPx`, default ≈18 rows);
//   • rate-limit with exponential backoff: allowed again after
//     min(2^repeats · 1000ms, 30000ms); `repeats++` while the item count
//     did NOT grow, reset the moment it does;
//   • re-evaluate on every scroll frame (not just on threshold crossings),
//     so a backoff-skipped attempt is retried automatically;
//   • in-flight guard + isLoadingMore for async loaders.
//
// Two modes:
//   • local (default)  — arrays already in memory; each successful attempt
//     extends `visibleCount` by `step` (mock feeds, SearchView, sellers);
//   • async            — pass `loadMore(): Promise<boolean>` (cursor pages);
//     resolves to "hasMore after this page".
// ============================================================================

import { useCallback, useEffect, useRef, useState } from "react";

export type InfiniteFeedOptions<T> = {
  /** The full item list (source of truth for local slicing). */
  items: readonly T[];
  /** Initial window size (ProductGrid's `initial`). */
  initial: number;
  /** Page size per attempt (ProductGrid's `step`). */
  step: number;
  /** Master switch — mirrors ProductGrid's `loadMore` prop. */
  enabled?: boolean;
  /** Distance from the viewport bottom that triggers a load, in px. */
  lookaheadPx?: number;
  /** Async cursor loader; return `false` when no pages remain. */
  loadMore?: () => Promise<boolean>;
};

export type InfiniteFeed<T> = {
  /** Items to render: `items.slice(0, visibleCount)`. */
  visible: T[];
  /** Whether another attempt could grow the window. */
  hasMore: boolean;
  /** True while an async `loadMore()` is running. */
  isLoadingMore: boolean;
  /** Manual attempt (Load More button) — bypasses the backoff wait. */
  extend: () => void;
  /** Attach to the element that sits at the end of the rendered list. */
  sentinelRef: (el: HTMLElement | null) => void;
};

const MAX_BACKOFF_MS = 30_000;

export function useInfiniteFeed<T>({
  items,
  initial,
  step,
  enabled = true,
  lookaheadPx = 2000,
  loadMore,
}: InfiniteFeedOptions<T>): InfiniteFeed<T> {
  const total = items.length;
  const [visibleCount, setVisibleCount] = useState(() =>
    Math.min(initial, total)
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [asyncHasMore, setAsyncHasMore] = useState(true);

  const hasMore = enabled
    ? loadMore
      ? asyncHasMore
      : visibleCount < total
    : false;

  const repeatsRef = useRef(0);
  const lastAttemptRef = useRef(0);
  const inFlightRef = useRef(false);
  const retryTimerRef = useRef<number | null>(null);
  const sentinelElRef = useRef<HTMLElement | null>(null);
  const attemptRef = useRef<(manual: boolean) => void>(() => {});

  const clearRetry = () => {
    if (retryTimerRef.current !== null) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  };

  // Growth: window advanced or the source list grew → reset backoff
  // (cosmos resets `repeats` the moment the item count changes).
  useEffect(() => {
    repeatsRef.current = 0;
    clearRetry();
  }, [visibleCount, total]);

  // --- one attempt -----------------------------------------------------------

  const attempt = useCallback(
    (manual: boolean) => {
      if (!enabled || !hasMore || inFlightRef.current) return;

      const now = performance.now();
      const elapsed = now - lastAttemptRef.current;
      // Exponential backoff window: min(2^repeats · 1s, 30s).
      const wait = Math.min(2 ** repeatsRef.current * 1000, MAX_BACKOFF_MS);
      if (!manual && elapsed < wait) {
        // Schedule exactly one retry when the backoff window closes.
        if (retryTimerRef.current === null) {
          retryTimerRef.current = window.setTimeout(() => {
            retryTimerRef.current = null;
            attemptRef.current(false);
          }, wait - elapsed + 10);
        }
        return;
      }
      lastAttemptRef.current = now;

      if (loadMore) {
        inFlightRef.current = true;
        setIsLoadingMore(true);
        loadMore()
          .then((more) => {
            setAsyncHasMore(more);
            if (!more) repeatsRef.current = 0;
          })
          .catch(() => {
            repeatsRef.current += 1; // error → back off like a stalled page
          })
          .finally(() => {
            inFlightRef.current = false;
            setIsLoadingMore(false);
          });
        return;
      }

      // Local mode: extend the visible window by one step. Growth is
      // guaranteed here (hasMore implies visibleCount < total).
      setVisibleCount((prev) => Math.min(prev + Math.max(1, step), total));
    },
    [enabled, hasMore, loadMore, step, total]
  );

  useEffect(() => {
    attemptRef.current = attempt;
  });

  const extend = useCallback(() => attempt(true), [attempt]);

  // --- sentinel: re-evaluate every scroll frame (not IO edge crossings) ------

  useEffect(() => {
    const el = sentinelElRef.current;
    if (!el || !enabled || !hasMore) return;

    let raf = 0;
    const check = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      if (rect.top - window.innerHeight <= lookaheadPx) attempt(false);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    raf = requestAnimationFrame(check); // initial check, off the effect body
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [enabled, hasMore, lookaheadPx, attempt]);

  // --- reset when the source list changes (sort/filter/navigation) -----------
  // Mirrors the old ProductGrid frame pattern: a new items identity snaps the
  // window back to `initial` (clamped to the list size).

  const itemsRef = useRef(items);
  useEffect(() => {
    if (itemsRef.current !== items) {
      itemsRef.current = items;
      setVisibleCount(Math.min(initial, items.length));
      setAsyncHasMore(true);
    }
  }, [items, initial]);

  useEffect(() => () => clearRetry(), []);

  const sentinelRef = useCallback((el: HTMLElement | null) => {
    sentinelElRef.current = el;
  }, []);

  return {
    visible:
      visibleCount >= total ? (items as T[]) : items.slice(0, visibleCount),
    hasMore,
    isLoadingMore,
    extend,
    sentinelRef,
  };
}
