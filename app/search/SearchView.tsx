"use client";

import { useMemo } from "react";
import ProductGrid from "@/components/ProductGrid";
import { ButtonLink } from "@/components/ui";
import { useLang } from "@/lib/i18n";
import { searchProducts } from "@/lib/mock";

export default function SearchView({ query }: { query: string }) {
  const { t } = useLang();
  const results = useMemo(() => searchProducts(query), [query]);

  return (
    <div>
      <div className="flex flex-col gap-4 px-5 pb-6 pt-8 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-mute">
            {t("search.title")}
          </p>
          <h1 className="mt-3 text-[28px] font-medium uppercase tracking-tight text-ink sm:text-[32px]">
            {query ? `“${query}”` : t("search.title")}
          </h1>
          <p className="mt-1 text-sm text-mute">
            {results.length} {results.length === 1 ? t("plp.resultOne") : t("plp.results")}
          </p>
        </div>
        <ButtonLink href="/category/all" variant="secondary" className="w-fit">
          {t("search.viewAll")}
        </ButtonLink>
      </div>

      {results.length > 0 ? (
        <div className="px-2 sm:px-6">
          <ProductGrid items={results} initial={results.length} step={0} cols={4} />
        </div>
      ) : (
        <div className="flex flex-col items-start gap-6 px-5 py-16 sm:px-8">
          <p className="max-w-[34ch] text-sm leading-6 text-charcoal">
            {t("search.emptyDesc")}
          </p>
          <ButtonLink href="/category/all" variant="primary">
            {t("search.viewAll")}
          </ButtonLink>
        </div>
      )}
    </div>
  );
}