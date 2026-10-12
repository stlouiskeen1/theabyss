// ============================================================================
// MASONRY ENGINE — lane packing for the product grids.
//
// Ported from the cosmos.so masonry kernel found in REA evidence
// ev_47d8512f3eeedae1…9cf32acf05 (chunk 0yjkmb0dp3sir.js):
//   • heights are ESTIMATED up front (media aspect + fixed body allowance),
//     then corrected from real measurements once tiles mount;
//   • items go to the currently SHORTEST lane (greedy first-fit);
//   • lanes can be "balanced" — short lanes stretch their trailing items
//     (bounded by maxGrowRatio) so every column ends flush;
//   • minItemHeight keeps degenerate/zero-height items from collapsing.
//
// Everything here is pure (no DOM) so it can be unit-tested with plain node.
// ============================================================================

export type MasonryPlacement = {
  /** Index in the input array. */
  index: number;
  /** Zero-based column this item sits in. */
  lane: number;
  /** Distance from the grid's top to this item's top. */
  top: number;
  /** Height of the item's box (may exceed its natural height when balancing). */
  height: number;
  /** Natural (unbalanced) height this item was packed with. */
  naturalHeight: number;
};

export type MasonryResult = {
  placements: MasonryPlacement[];
  /** Accumulated bottom edge of each lane (after balancing). */
  laneBottoms: number[];
  /** Overall grid height (= tallest lane). */
  totalHeight: number;
};

export type PackOptions = {
  columns: number;
  /** Vertical + horizontal gutter between items, in px. */
  gap?: number;
  /**
   * "start"    — plain greedy pack, lanes end unevenly (default).
   * "balanced" — shorter lanes stretch trailing items (≤ maxGrowRatio each)
   *              so all lanes end flush at the tallest lane's bottom.
   */
  baseline?: "start" | "balanced";
  /** Clamp for degenerate heights (cosmos: 100). */
  minItemHeight?: number;
  /** Max multiple of natural height one item may stretch to when balancing. */
  maxGrowRatio?: number;
};

export const MASONRY_DEFAULTS = {
  gap: 16,
  minItemHeight: 100,
  maxGrowRatio: 1.3,
} as const;

/**
 * Estimated height for a product card before it has been measured:
 * media box (aspect = width/height, e.g. 4/5) + body allowance for the
 * text under it. Mirrors cosmos' estimateElementHeight fallback chain.
 */
export function estimateCardHeight(
  columnWidth: number,
  opts: { mediaAspect?: number; bodyHeight?: number } = {}
): number {
  const { mediaAspect = 4 / 5, bodyHeight = 176 } = opts;
  const mediaHeight = columnWidth / mediaAspect;
  return mediaHeight + bodyHeight;
}

/**
 * Pack items into lanes by their (estimated or measured) heights.
 *
 * Greedy first-fit: each item lands in the shortest lane so far — the same
 * assignment loop cosmos uses (`U` / pick lane with min accumulated height).
 * Input order is preserved in `placements`; lanes are kept full (cosmos pins
 * only the first `itemsOffset` items to lane 0, which we don't need here).
 */
export function packMasonry(
  heights: readonly number[],
  options: PackOptions
): MasonryResult {
  const {
    columns,
    gap = MASONRY_DEFAULTS.gap,
    baseline = "start",
    minItemHeight = MASONRY_DEFAULTS.minItemHeight,
    maxGrowRatio = MASONRY_DEFAULTS.maxGrowRatio,
  } = options;

  const cols = Math.max(1, Math.floor(columns));
  const laneBottoms = new Array<number>(cols).fill(0);
  const laneItems: number[][] = Array.from({ length: cols }, () => []);
  const placements: MasonryPlacement[] = [];

  for (let i = 0; i < heights.length; i++) {
    const natural = Math.max(minItemHeight, heights[i] || 0);

    // Shortest lane wins; ties resolve to the lowest lane index.
    let lane = 0;
    for (let c = 1; c < cols; c++) {
      if (laneBottoms[c] < laneBottoms[lane] - 0.01) lane = c;
    }

    const top = laneBottoms[lane];
    laneBottoms[lane] = top + natural + gap;
    laneItems[lane].push(i);
    placements.push({ index: i, lane, top, height: natural, naturalHeight: natural });
  }

  if (baseline === "balanced" && cols > 1) {
    balanceLanes(placements, laneItems, laneBottoms, gap, maxGrowRatio);
  }

  // laneBottoms currently includes a trailing gap on every lane; strip it so
  // totalHeight measures the last item's actual bottom edge.
  const trimmed = laneBottoms.map((b) => (heights.length ? b - gap : 0));
  const totalHeight = trimmed.reduce((m, b) => Math.max(m, b), 0);

  return { placements, laneBottoms: trimmed, totalHeight };
}

/**
 * Stretch the trailing items of shorter lanes up to the tallest lane's
 * bottom, distributing the deficit proportionally and capping each item at
 * maxGrowRatio × natural. Partial flush is acceptable — we never SHRINK an
 * item below its natural height (shrinking would clip card content; cosmos
 * can shrink because its tiles are media-only estimates, ours are real DOM).
 */
function balanceLanes(
  placements: MasonryPlacement[],
  laneItems: number[][],
  laneBottoms: number[],
  gap: number,
  maxGrowRatio: number
): void {
  const target = Math.max(...laneBottoms);

  for (let lane = 0; lane < laneBottoms.length; lane++) {
    let deficit = target - laneBottoms[lane];
    if (deficit <= 0.5) continue;

    const items = laneItems[lane];
    if (items.length === 0) continue;

    const byIndex = new Map(placements.map((p) => [p.index, p]));
    const totalNatural = items.reduce((s, idx) => s + byIndex.get(idx)!.naturalHeight, 0);
    if (totalNatural <= 0) continue;

    // Distribute over the lane's items (proportional to natural height),
    // respecting per-item grow caps. Repeat until flush or no headroom.
    for (let pass = 0; pass < 3 && deficit > 0.5; pass++) {
      let headroom = 0;
      for (const idx of items) {
        const p = byIndex.get(idx)!;
        headroom += p.naturalHeight * maxGrowRatio - p.height;
      }
      if (headroom <= 0.5) break;

      const give = Math.min(deficit, headroom);
      for (const idx of items) {
        const p = byIndex.get(idx)!;
        const itemHeadroom = p.naturalHeight * maxGrowRatio - p.height;
        if (itemHeadroom <= 0) continue;
        const share = give * (p.naturalHeight / totalNatural);
        p.height += Math.min(share, itemHeadroom);
      }
      deficit -= give;
    }

    // Recompute tops of this lane from the adjusted heights.
    let y = 0;
    for (const idx of items) {
      const p = byIndex.get(idx)!;
      p.top = y;
      y += p.height + gap;
    }
    laneBottoms[lane] = y;
  }
}

/**
 * Which packed items intersect the viewport slice [from, to)? Used by the
 * virtualization layer to decide which lanes are mounted.
 * Assumes placements are in input order — returns index range conservatively.
 */
export function visibleRange(
  placements: readonly MasonryPlacement[],
  from: number,
  to: number
): { first: number; last: number } {
  let first = placements.length;
  let last = -1;
  for (const p of placements) {
    const bottom = p.top + p.height;
    if (bottom > from && p.top < to) {
      first = Math.min(first, p.index);
      last = Math.max(last, p.index);
    }
  }
  if (last < 0) return { first: 0, last: -1 };
  return { first, last };
}
