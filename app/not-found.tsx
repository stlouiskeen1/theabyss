"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n";

export default function NotFound() {
  const { t } = useLang();
  return (
    <main className="flex flex-1 flex-col items-start justify-center px-margin-mobile py-unit-2xl sm:px-margin-desktop">
      <div className="w-full max-w-3xl">
        <div className="flex items-center gap-unit-xs font-mono-technical text-mono-technical uppercase">
          <span className="inline-block h-2 w-2 bg-accent-crimson" />
          <span className="font-label-caps text-label-caps tracking-widest text-text-muted">
            {t("notFound.code")}
          </span>
          <span>/</span>
          <span className="text-status-cod">{t("notFound.tag")}</span>
        </div>

        <h1 className="mt-unit-md font-display-hero text-display-hero-mobile uppercase tracking-tight text-primary sm:text-display-hero">
          {t("notFound.title")}
        </h1>

        <p className="mt-unit-md max-w-[44ch] font-body-editorial text-body-editorial text-text-muted">
          {t("notFound.desc")}
        </p>

        <div className="mt-unit-lg flex flex-col gap-unit-md sm:flex-row">
          <Link
            href="/"
            className="press focus-kill inline-flex h-12 items-center justify-center gap-unit-xs bg-primary px-unit-xl font-label-caps text-label-caps uppercase tracking-wider text-on-primary shadow-sm transition-all hover:bg-surface-charcoal"
          >
            {t("notFound.cta")}
          </Link>
          <Link
            href="/category/all"
            className="press focus-kill inline-flex h-12 items-center justify-center gap-unit-xs bg-surface-paper px-unit-xl font-label-caps text-label-caps uppercase tracking-wider text-primary ring-1 ring-border-rule shadow-sm transition-all hover:bg-surface-canvas hover:ring-primary"
          >
            {t("notFound.browse")}
          </Link>
        </div>
      </div>
    </main>
  );
}