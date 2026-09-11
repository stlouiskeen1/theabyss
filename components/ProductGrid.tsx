"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";
import type { Product } from "@/lib/mock";
import ProductCard from "@/components/ProductCard";

type Props = {
  items: Product[];
  initial?: number;
  step?: number;
  loadMore?: boolean;
  cols?: 2 | 3 | 4;
};

const COLS: Record<number, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4",
};

export default function ProductGrid({
  items,
  initial = 12,
  step = 8,
  loadMore = true,
  cols = 4,
}: Props) {
  const { t } = useLang();
  const [visible, setVisible] = useState(initial);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const [frame, setFrame] = useState<{ items: Product[]; initial: number }>({
    items,
    initial,
  });
  if (frame.items !== items || frame.initial !== initial) {
    setFrame({ items, initial });
    setVisible(initial);
  }

  const shown = items.slice(0, visible);
  const hasMore = loadMore && visible < items.length;

  useEffect(() => {
    if (!hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible((v) => v + step);
        }
      },
      { rootMargin: "800px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, step]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <div className={`grid gap-gutter-desktop ${COLS[cols]}`}>
        {shown.map((item) => (
          <ProductCard key={item.id} product={item} />
        ))}
      </div>

      {loadMore && (
        <div className="flex flex-col items-center gap-4 pb-4 pt-12">
          <div ref={sentinelRef} className="h-px w-full" aria-hidden="true" />
          {hasMore ? (
            <button
              type="button"
              onClick={() => setVisible((v) => v + step)}
              className="press focus-kill inline-flex h-12 items-center justify-center gap-unit-xs px-unit-xl font-label-caps text-label-caps uppercase tracking-wider text-primary shadow-sm ring-1 ring-border-rule transition-all hover:bg-surface-canvas hover:ring-primary"
            >
              {t("home.loadMore")}
            </button>
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