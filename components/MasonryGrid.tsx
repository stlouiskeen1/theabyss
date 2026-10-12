"use client";

// ============================================================================
// MasonryGrid — responsive masonry product grid.
//
// Modeled on cosmos.so's InfiniteScroll.Masonry (REA ev_47d8512f3eeedae1…):
//   • measures container width → resolves column count from breakpoints,
//   • packs items with lib/masonry (estimated heights → measured correction),
//   • absolute lane positioning: left = lane * (colWidth + gap),
//   • first `columns` items are flagged isFirstRow for high-priority media,
//   • virtualization: only tiles intersecting the viewport window (plus
//     warm-up-gated overscan) mount their content — before the first scroll
//     or 3s timeout the overscan stays 0, exactly like cosmos,
//   • before the width is known (SSR/hydration) it renders as the regular
//     responsive CSS grid so server HTML is never blank.
// ============================================================================

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  MASONRY_DEFAULTS,
  estimateCardHeight,
  packMasonry,
} from "@/lib/masonry";

export type MasonryRenderMeta = {
  index: number;
  /** True for the first `columns` tiles — mirror of cosmos' TilePriorityContext. */
  isFirstRow: boolean;
};

type Props<T> = {
  items: readonly T[];
  getKey: (item: T, index: number) => string;
  renderItem: (item: T, index: number, meta: MasonryRenderMeta) => ReactNode;
  /** Maximum columns (desktop). Mirrors ProductGrid's responsive breakpoints. */
  cols?: 2 | 3 | 4;
  /** Gutter between tiles — defaults to the desktop gutter token (16px). */
  gap?: number;
  /** Media box aspect (w/h) used for height estimation — cards are 4:5. */
  mediaAspect?: number;
  /** Estimated text-body height under the media, in px. */
  bodyHeight?: number;
  className?: string;
};

/** Tailwind-breakpoint parity with ProductGrid's COLS classes. */
export function resolveColumns(width: number, max: 2 | 3 | 4): number {
  if (max === 2) return width >= 640 ? 2 : 1;
  if (max === 3) return width >= 1280 ? 3 : width >= 768 ? 2 : 1;
  return width >= 1280 ? 4 : width >= 768 ? 3 : width >= 640 ? 2 : 1;
}

/** Static-grid fallback classes — identical layout to the old ProductGrid. */
const STATIC_COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4",
};

type Measurement = { height: number; atWidth: number };

/** Below this many items, virtualization and scroll listeners are pure overhead. */
const VIRTUALIZE_MIN_ITEMS = 50;
/** Measured heights within this margin of the estimate are ignored (avoids a reflow flash). */
const MEASURE_NOISE_PX = 12;

export default function MasonryGrid<T>({
  items,
  getKey,
  renderItem,
  cols = 4,
  gap = MASONRY_DEFAULTS.gap,
  mediaAspect = 4 / 5,
  bodyHeight = 176,
  className = "",
}: Props<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrappersRef = useRef(new Map<string, HTMLElement>());
  const roRef = useRef<ResizeObserver | null>(null);

  const [width, setWidth] = useState(0);
  const [measured, setMeasured] = useState<Map<string, Measurement>>(
    () => new Map()
  );

  const columns = width > 0 ? resolveColumns(width, cols) : 0;
  const ready = columns >= 1;
  const colWidth = ready ? (width - gap * (columns - 1)) / columns : 0;
  const virtualize = items.length > VIRTUALIZE_MIN_ITEMS;

  // --- measurement: container width + per-tile natural heights -------------
  // Both ResizeObservers report through setState — they are subscriptions to
  // an external system, so callbacks (never effect bodies) own the updates.

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const widthRo = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target !== container) continue;
        const w = Math.round(entry.contentRect.width);
        setWidth((prev) => (Math.abs(prev - w) > 0.5 ? w : prev));
      }
    });

    const tileRo = new ResizeObserver((entries) => {
      const updates = new Map<string, Measurement>();
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        const key = el.dataset.mkey;
        if (!key) continue;
        const box = entry.borderBoxSize?.[0];
        const h = box ? box.blockSize : el.getBoundingClientRect().height;
        const w = entry.contentRect.width;
        if (h <= 0 || w <= 0) continue;
        updates.set(key, { height: h, atWidth: w });
      }
      if (updates.size === 0) return;
      setMeasured((prev) => {
        let changed = false;
        let next: Map<string, Measurement> | null = null;
        for (const [key, m] of updates) {
          const p = prev.get(key);
          if (
            !p ||
            Math.abs(p.height - m.height) > 0.5 ||
            p.atWidth !== m.atWidth
          ) {
            if (!next) next = new Map(prev);
            next.set(key, m);
            changed = true;
          }
        }
        return changed && next ? next : prev;
      });
    });

    for (const el of wrappersRef.current.values()) tileRo.observe(el);
    widthRo.observe(container);
    roRef.current = tileRo;

    return () => {
      widthRo.disconnect();
      tileRo.disconnect();
      roRef.current = null;
    };
  }, []);

  // Stable ref callback with React 19 cleanup — no per-key closure map,
  // nothing read from refs during render.
  const setWrapper = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const key = el.dataset.mkey;
    if (!key) return;
    wrappersRef.current.set(key, el);
    roRef.current?.observe(el);
    return () => {
      wrappersRef.current.delete(key);
      roRef.current?.unobserve(el);
    };
  }, []);

  // --- heights → pack -------------------------------------------------------
  // Stale measurements for filtered-out keys are harmless (they're still the
  // right height for that product if it comes back), so nothing is pruned.

  const heights = useMemo(() => {
    return items.map((item, i) => {
      const estimate = estimateCardHeight(colWidth || 320, {
        mediaAspect,
        bodyHeight,
      });
      const m = measured.get(getKey(item, i));
      if (m && ready) {
        // Rescale measured height to the current column width:
        // media (aspect box) moves 1/mediaAspect px per px of width, body is fixed.
        const mediaPerWidth = 1 / mediaAspect;
        const actual = m.height + (colWidth - m.atWidth) * mediaPerWidth;
        // Ignore measurements within noise of the estimate — applying them
        // would re-pack every tile after first paint for no visual change.
        if (Math.abs(actual - estimate) > MEASURE_NOISE_PX) return actual;
      }
      return estimate;
    });
  }, [items, getKey, measured, colWidth, ready, mediaAspect, bodyHeight]);

  const pack = useMemo(() => {
    if (!ready) return null;
    return packMasonry(heights, { columns, gap, baseline: "start" });
  }, [heights, columns, gap, ready]);

  // --- virtualization: viewport window + warm-up-gated overscan -------------
  //
  // Cosmos' InfiniteScroll keeps overscan at 0 until the grid is "warm"
  // (first scroll / 3s timeout), then grows it to
  // clamp(ceil(3.5 × viewport / rowHeight), 3, 12) rows. Only tiles
  // intersecting [from − overscan, to + overscan] mount content; the
  // container keeps the full packed height so scroll geometry never shifts.

  const [viewport, setViewport] = useState<{ from: number; to: number } | null>(
    null
  );
  const isWarmRef = useRef(false);
  const [isWarm, setIsWarm] = useState(false);
  const warmUp = useCallback(() => {
    if (isWarmRef.current) return;
    isWarmRef.current = true;
    setIsWarm(true);
  }, []);

  // Warm-up has its own effect so a repack (measurement landing) can never
  // restart/discard the 3s fallback timer.
  useEffect(() => {
    if (!virtualize) return;
    const timer = window.setTimeout(warmUp, 3000);
    return () => window.clearTimeout(timer);
  }, [warmUp, virtualize]);

  useEffect(() => {
    if (!pack || !virtualize) return; // static grid or small list: no windowing
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const from = -rect.top; // viewport top, container-relative
      const to = from + window.innerHeight;
      setViewport((prev) =>
        prev && Math.abs(prev.from - from) < 1 && Math.abs(prev.to - to) < 1
          ? prev
          : { from, to }
      );
    };
    const onScroll = () => {
      warmUp();
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onResize = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    raf = requestAnimationFrame(update); // first snapshot, off the effect body
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [warmUp, pack, virtualize]);

  const mountRange = useMemo(() => {
    if (!virtualize || !pack || !viewport) return null; // mount everything
    const rowCount = Math.max(1, Math.ceil(items.length / Math.max(1, columns)));
    const rowHeight = pack.totalHeight / rowCount;
    const overscanRows = isWarm
      ? Math.min(12, Math.max(3, Math.ceil((3.5 * window.innerHeight) / rowHeight)))
      : 0;
    const pad = overscanRows * rowHeight;
    const from = viewport.from - pad;
    const to = viewport.to + pad;
    let first = Infinity;
    let last = -1;
    for (const p of pack.placements) {
      if (p.top + p.height > from && p.top < to) {
        first = Math.min(first, p.index);
        last = Math.max(last, p.index);
      }
    }
    return last < 0 ? { first: 0, last: -1 } : { first, last };
  }, [pack, viewport, isWarm, items.length, columns, virtualize]);

  // --- render ---------------------------------------------------------------

  const containerStyle: CSSProperties | undefined = pack
    ? { position: "relative", height: pack.totalHeight }
    : undefined;

  return (
    <div
      ref={containerRef}
      className={pack ? className : `grid gap-gutter-desktop ${STATIC_COLS[cols]} ${className}`}
      style={containerStyle}
    >
      {items.map((item, i) => {
        const key = getKey(item, i);
        const p = pack?.placements[i];
        const style: CSSProperties | undefined = p
          ? {
              position: "absolute",
              top: p.top,
              left: p.lane * (colWidth + gap),
              width: colWidth,
            }
          : undefined;
        const mounted =
          !mountRange || (i >= mountRange.first && i <= mountRange.last);
        return (
          <div key={key} data-mkey={key} ref={setWrapper} style={style}>
            {mounted
              ? renderItem(item, i, { index: i, isFirstRow: i < columns })
              : null}
          </div>
        );
      })}
    </div>
  );
}
