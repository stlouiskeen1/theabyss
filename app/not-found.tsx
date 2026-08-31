"use client";

import { ButtonLink } from "@/components/ui";
import { useLang } from "@/lib/i18n";

export default function NotFound() {
  const { t } = useLang();
  return (
    <div className="flex flex-1 flex-col items-start justify-center px-5 py-24 sm:px-8">
      <p className="text-xs font-medium uppercase tracking-wide text-mute">
        {t("notFound.code")}
      </p>
      <h1 className="mt-4 font-display text-6xl font-normal uppercase leading-[0.9] tracking-tight text-ink sm:text-7xl">
        {t("notFound.title")}
      </h1>
      <p className="mt-5 max-w-[30ch] text-base leading-7 text-charcoal">
        {t("notFound.desc")}
      </p>
      <ButtonLink href="/" variant="primary" className="mt-10">
        {t("notFound.cta")}
      </ButtonLink>
    </div>
  );
}