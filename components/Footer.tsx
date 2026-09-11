"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n";
import { ArrowIcon } from "@/components/ui";

export default function Footer() {
  const { t } = useLang();
  const year = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const subscribe = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setEmail("");
    setSubscribed(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSubscribed(false), 3200);
  };

  return (
    <footer className="mt-unit-4xl w-full border-t border-border-rule bg-surface-paper text-on-surface">
      <div className="w-full px-margin-mobile py-unit-3xl sm:px-margin-desktop">
        <div className="grid grid-cols-1 gap-unit-2xl border-b border-border-rule pb-unit-3xl md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-unit-md">
            <div className="font-headline-lg text-headline-sm font-bold uppercase tracking-tighter text-primary">
              ABYSS
            </div>
            <p className="max-w-sm font-body-editorial text-body-editorial text-text-muted">
              {t("footer.about")}
            </p>
            <div className="inline-flex w-fit items-center gap-unit-xs border border-status-cod bg-surface-canvas px-unit-sm py-1">
              <span className="inline-block h-2 w-2 bg-status-cod" />
              <span className="font-label-caps-sm text-label-caps-sm uppercase text-status-cod">
                {t("footer.badge")}
              </span>
            </div>
          </div>

          {/* Logistics & Territory */}
          <div className="flex flex-col gap-unit-sm">
            <span className="border-b border-border-rule pb-unit-xs font-label-caps text-label-caps uppercase tracking-widest text-primary">
              {t("footer.logistics")}
            </span>
            <ul className="flex flex-col gap-unit-xs font-body-utility text-body-utility text-text-muted">
              <li className="flex justify-between border-b border-border-rule py-1">
                <span className="font-mono-technical text-label-caps uppercase">
                  {t("footer.stopDesk")}
                </span>
                <span className="font-mono-technical font-bold text-primary">
                  400-600 DZD
                </span>
              </li>
              <li className="flex justify-between border-b border-border-rule py-1">
                <span className="font-mono-technical text-label-caps uppercase">
                  {t("footer.homeDelivery")}
                </span>
                <span className="font-mono-technical font-bold text-primary">
                  700-1200 DZD
                </span>
              </li>
              <li className="flex justify-between border-b border-border-rule py-1">
                <span className="font-mono-technical text-label-caps uppercase">
                  {t("footer.authentication")}
                </span>
                <span className="font-mono-technical font-bold text-status-cod">
                  {t("footer.hub")}
                </span>
              </li>
              <li className="pt-unit-xs font-label-caps-sm text-label-caps-sm uppercase text-text-muted">
                {t("footer.inspectNote")}
              </li>
            </ul>
          </div>

          {/* Boutiques ecosystem */}
          <div className="flex flex-col gap-unit-sm">
            <span className="border-b border-border-rule pb-unit-xs font-label-caps text-label-caps uppercase tracking-widest text-primary">
              {t("footer.ecosystem")}
            </span>
            <ul className="flex flex-col gap-unit-sm font-body-utility text-body-utility text-text-muted">
              <li>
                <Link
                  href="/seller/s1"
                  className="flex items-center justify-between border border-primary px-unit-sm py-unit-xs font-label-caps-sm text-label-caps-sm font-bold uppercase text-primary transition-colors hover:bg-primary hover:text-on-primary"
                >
                  <span>{t("footer.partnerCta")}</span>
                  <ArrowIcon size={14} />
                </Link>
              </li>
              <li>
                <Link href="/seller/s1" className="hover:text-primary transition-colors">
                  {t("footer.indexCreators")}
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  {t("footer.charter")}
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  {t("footer.returnPolicy")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Archive bulletin */}
          <div className="flex flex-col gap-unit-md">
            <span className="border-b border-border-rule pb-unit-xs font-label-caps text-label-caps uppercase tracking-widest text-primary">
              {t("footer.newsletterTitle")}
            </span>
            <p className="font-body-utility text-body-utility text-text-muted">
              {t("footer.newsletterSub")}
            </p>
            <form onSubmit={subscribe} className="flex flex-col gap-unit-xs">
              <div className="flex items-center border-b border-primary">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label={t("footer.newsletterTitle")}
                  placeholder={t("footer.newsletterPlaceholder")}
                  className="w-full bg-transparent py-unit-xs font-mono-technical text-mono-technical uppercase text-primary outline-none placeholder:text-text-muted"
                />
                <button
                  type="submit"
                  aria-label={t("home.newsletterCta")}
                  className="px-unit-xs text-primary transition-colors hover:text-accent-crimson"
                >
                  <ArrowIcon size={18} />
                </button>
              </div>
              <span className="font-label-caps-sm text-label-caps-sm text-status-cod">
                {subscribed ? t("footer.newsletterDone") : t("footer.newsletterNote")}
              </span>
            </form>
          </div>
        </div>

        {/* Legal row */}
        <div className="flex flex-col items-center justify-between gap-unit-md pt-unit-lg font-label-caps-sm text-label-caps-sm uppercase text-text-muted md:flex-row">
          <div className="flex items-center gap-unit-lg">
            <span>{t("footer.rightsLong", { year })}</span>
            <span className="hidden sm:inline-block">·</span>
            <span>{t("footer.cities")}</span>
          </div>
          <div className="flex items-center gap-unit-lg">
            <span>{t("footer.conditions")}</span>
            <span>{t("footer.privacy")}</span>
            <span>{t("footer.legal")}</span>
            <span className="font-mono-technical text-primary">{t("footer.reg")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}