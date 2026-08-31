"use client";

import Link from "next/link";
import { LANGUAGES, useLang } from "@/lib/i18n";

const COLUMNS = [
  {
    titleKey: "footer.shop",
    links: [
      { key: "footer.link.new", href: "/category/all" },
      { key: "footer.link.apparel", href: "/category/apparel" },
      { key: "footer.link.footwear", href: "/category/footwear" },
      { key: "footer.link.accessories", href: "/category/accessories" },
      { key: "footer.link.outerwear", href: "/category/outerwear" },
    ],
  },
  {
    titleKey: "footer.help",
    links: [
      { key: "footer.link.contact", href: "/" },
      { key: "footer.link.shipping", href: "/" },
      { key: "footer.link.size", href: "/" },
    ],
  },
  {
    titleKey: "footer.company",
    links: [
      { key: "footer.link.about", href: "/" },
      { key: "footer.link.careers", href: "/" },
      { key: "footer.link.sustainability", href: "/" },
    ],
  },
  {
    titleKey: "footer.sellers",
    links: [
      { key: "footer.link.start", href: "/" },
      { key: "footer.link.stories", href: "/seller/s1" },
      { key: "footer.link.fees", href: "/" },
    ],
  },
] as const;

export default function Footer() {
  const { lang, setLang, t } = useLang();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-canvas">
      <div className="grid grid-cols-2 gap-x-8 gap-y-10 border-t border-hairline px-5 py-12 sm:px-8 md:grid-cols-4">
        {COLUMNS.map((col) => (
          <div key={col.titleKey as string}>
            <h3 className="text-sm font-medium uppercase text-ink">
              {t(col.titleKey)}
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {col.links.map((l) => (
                <li key={l.key}>
                  <Link
                    href={l.href}
                    className="text-sm leading-snug text-mute transition-colors hover:text-ink hover:underline hover:underline-offset-2"
                  >
                    {t(l.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-hairline">
        <div className="flex flex-col gap-4 px-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-xs leading-relaxed text-mute">
            {t("footer.rights", { year })}
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium uppercase tracking-wide text-mute">
            <span>{t("footer.country")}</span>
            <div className="flex items-center gap-1">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLang(l.code)}
                  aria-pressed={lang === l.code}
                  className={`px-2 py-1 transition-colors ${
                    lang === l.code
                      ? "text-ink underline decoration-ink decoration-2 underline-offset-4"
                      : "hover:text-ink"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <span className="h-3 w-px bg-hairline" aria-hidden="true" />
            <Link href="/" className="transition-colors hover:text-ink">
              {t("footer.terms")}
            </Link>
            <Link href="/" className="transition-colors hover:text-ink">
              {t("footer.privacy")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}