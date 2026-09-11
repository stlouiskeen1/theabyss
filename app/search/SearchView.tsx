"use client";

import { useMemo } from "react";
import { useLang } from "@/lib/i18n";
import { searchProducts } from "@/lib/mock";
import ProductGrid from "@/components/ProductGrid";
import { ButtonLink } from "@/components/ui";

export default function SearchView({ query }: { query: string }) {
  const { t } = useLang();
  const results = useMemo(() => searchProducts(query), [query]);

  return (
    <div>
      {/* Search results header */}
      <section className="w-full border-b border-border-rule bg-surface-paper px-margin-mobile py-unit-xl sm:px-margin-desktop">
        <div className="flex flex-col justify-between gap-unit-lg lg:flex-row lg:items-end">
          <div>
            <p className="font-label-caps-sm text-label-caps-sm uppercase tracking-widest text-text-muted">
              {t("search.title")}
            </p>
            <h1 className="mt-2 font-headline-lg text-headline-lg uppercase tracking-tight text-primary">
              {query ? `“${query}”` : t("search.title")}
            </h1>
            <p className="mt-1 font-body-utility text-body-utility text-text-muted">
              {results.length}{" "}
              {results.length === 1 ? t("plp.resultOne") : t("plp.results")} ·{" "}
              {t("plp.statusBar", { shown: results.length, total: results.length })}
            </p>
          </div>
          <ButtonLink href="/category/all" variant="secondary" className="w-fit">
            {t("search.viewAll")}
          </ButtonLink>
        </div>
      </section>

      {results.length > 0 ? (
        <section className="w-full bg-surface-canvas py-unit-2xl">
          <div className="w-full px-margin-mobile sm:px-margin-desktop">
            <ProductGrid items={results} initial={results.length} step={0} cols={4} />
          </div>
        </section>
      ) : (
        <section className="w-full bg-surface-canvas py-unit-2xl">
          <div className="w-full px-margin-mobile sm:px-margin-desktop">
            <div className="flex flex-col items-start gap-6 border border-border-rule bg-surface-paper px-unit-lg py-unit-2xl">
              <p className="max-w-[34ch] font-body-editorial text-body-editorial text-text-muted">
                {t("search.emptyDesc")}
              </p>
              <ButtonLink href="/category/all" variant="primary">
                {t("search.viewAll")}
              </ButtonLink>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}