"use client";

import { useLang } from "@/lib/i18n";
import type { Product } from "@/lib/mock";
import ProductCard from "@/components/ProductCard";
import MasonryGrid from "@/components/MasonryGrid";
import { useInfiniteFeed } from "@/lib/useInfiniteFeed";

type Props = {
  items: Product[];
  initial?: number;
  step?: number;
  loadMore?: boolean;
  cols?: 2 | 3 | 4;
};

/**
 * Product feed — masonry layout + windowed virtualization + cosmos-style
 * infinite scroll (see components/MasonryGrid.tsx and lib/useInfiniteFeed.ts).
 * Public props are unchanged from the old grid/CSS implementation.
 */
export default function ProductGrid({
  items,
  initial = 24,
  step = 24,
  loadMore = true,
  cols = 4,
}: Props) {
  const { t } = useLang();
  const { visible, hasMore, isLoadingMore, extend, sentinelRef } =
    useInfiniteFeed({ items, initial, step, enabled: loadMore });

  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <MasonryGrid
        items={visible}
        getKey={(product) => product.id}
        cols={cols}
        renderItem={(product, _i, meta) => (
          <ProductCard product={product} priority={meta.isFirstRow} />
        )}
      />

      {loadMore && (
        <div className="flex flex-col items-center gap-4 pb-4 pt-12">
          <div
            ref={sentinelRef}
            className="h-px w-full"
            aria-hidden="true"
          />
          {hasMore ? (
            isLoadingMore ? (
              <div
                className="h-12 w-12 animate-spin rounded-full border-2 border-border-rule border-t-primary"
                role="status"
                aria-label={t("home.loadMore")}
              />
            ) : (
              <button
                type="button"
                onClick={extend}
                className="press focus-kill inline-flex h-12 items-center justify-center gap-unit-xs px-unit-xl font-label-caps text-label-caps uppercase tracking-wider text-primary shadow-sm ring-1 ring-border-rule transition-all hover:bg-surface-canvas hover:ring-primary"
              >
                {t("home.loadMore")}
              </button>
            )
          ) : (
            <p className="font-label-caps-sm text-label-caps-sm uppercase tracking-wider text-text-muted">
              {t("home.end")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
