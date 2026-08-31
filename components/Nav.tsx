"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LANGUAGES,
  useLang,
  categoryLabelKey,
  subcategoryLabelKey,
  genderLabelKey,
} from "@/lib/i18n";
import {
  CAT_SLUG_TO_LABEL,
  CATEGORIES,
  SUBCATEGORIES_BY_CATEGORY,
  getByDepartment,
  getBySubcategory,
  getProductsByCategory,
  type CategorySlug,
} from "@/lib/mock";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useWishlist } from "@/lib/wishlist";
import { BagIcon, HeartIcon, SearchIcon } from "@/components/ui";

const UTILITY_LABELS = ["seller", "help", "join"] as const;
const GENDERS = ["WOMEN", "MEN"] as const;

function LangToggle({ column = false }: { column?: boolean }) {
  const { lang, setLang } = useLang();
  return (
    <div
      className={`flex items-center ${column ? "flex-col items-start gap-1" : "gap-1"}`}
    >
      <span className="sr-only">Language / Langue</span>
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          aria-pressed={lang === l.code}
          className={`focus-kill px-2 py-1 text-[12px] font-medium uppercase tracking-wide transition-colors ${
            lang === l.code
              ? "text-ink underline decoration-ink decoration-2 underline-offset-4"
              : "text-mute hover:text-ink"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="M6 9 L12 15 L18 9" />
    </svg>
  );
}

type Row = { key: string; href: string; label: string };

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { count, openCart } = useCart();
  const { user } = useAuth();
  const { t } = useLang();
  const { ids: wishIds } = useWishlist();

  const wishCount = wishIds.length;

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Which category flyout is open on desktop (null = none).
  const [openDd, setOpenDd] = useState<string | null>(null);
  const closeDdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Which category row is expanded in the mobile drawer.
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Short-lived confirmation toast shown by the utility-bar actions
  // (Become a Seller / Help / Join Us / Sign In). There's no backend to
  // connect to, so clicking gives clear feedback instead of doing nothing.
  const [notice, setNotice] = useState(false);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showNotice() {
    setNotice(true);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(false), 2600);
  }

  useEffect(
    () => () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
      if (closeDdTimer.current) clearTimeout(closeDdTimer.current);
    },
    []
  );

  const [prevPath, setPrevPath] = useState(pathname);
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    setMenuOpen(false);
    setSearchOpen(false);
    setOpenDd(null);
    setExpandedRow(null);
    setQuery("");
  }

  // Close the category flyout with Escape.
  useEffect(() => {
    if (!openDd) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenDd(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openDd]);

  // Open the flyout on hover (desktop only), and schedule a close when the
  // cursor leaves either the trigger or the panel. The panel and the trigger
  // share the same timer, so moving between them never causes a flash.
  function openDdHover(key: string) {
    if (closeDdTimer.current) {
      clearTimeout(closeDdTimer.current);
      closeDdTimer.current = null;
    }
    setOpenDd(key);
  }

  function scheduleDdClose() {
    if (closeDdTimer.current) clearTimeout(closeDdTimer.current);
    closeDdTimer.current = setTimeout(() => setOpenDd(null), 120);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/");
    setSearchOpen(false);
  }

  const navRows: Row[] = [
    { key: "all", href: "/category/all", label: t("category.all") },
    ...CATEGORIES.map((c) => ({
      key: c.slug,
      href: `/category/${c.slug}`,
      label: t(categoryLabelKey(c.slug)),
    })),
  ];

  const activeLink =
    pathname === "/category/all"
      ? "all"
      : CATEGORIES.find((c) => pathname === `/category/${c.slug}`)?.slug ??
        null;

  // --- Flyout content -------------------------------------------------
  const shopLinks = (key: string) => {
    if (key === "all") {
      return CATEGORIES.map((c) => ({
        href: `/category/${c.slug}`,
        label: t(categoryLabelKey(c.slug)),
        count: getProductsByCategory(c.label).length,
        primary: false,
      }));
    }
    const cat = key as CategorySlug;
    return [
      {
        href: `/category/${cat}`,
        label: t("nav.viewAll", { cat: t(categoryLabelKey(key)) }),
        count: getProductsByCategory(CAT_SLUG_TO_LABEL[cat]).length,
        primary: true,
      },
      ...SUBCATEGORIES_BY_CATEGORY[cat].map((sub) => ({
        href: `/category/${cat}?sub=${sub}`,
        label: t(subcategoryLabelKey(sub)),
        count: getBySubcategory(cat, sub).length,
        primary: false,
      })),
    ];
  };

  const genderLinks = (key: string) =>
    GENDERS.map((g) => ({
      href: `/category/${key}?g=${g}`,
      label: t(genderLabelKey(g)),
      count: getByDepartment(key === "all" ? "ALL" : (key as CategorySlug), g)
        .length,
    }));

  const subList = (key: string) => {
    const links = shopLinks(key);
    return (
      <div className="flex flex-col items-start gap-3">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="focus-kill group flex items-baseline gap-2 text-sm text-ink transition-colors hover:text-charcoal"
          >
            <span
              className={`${l.primary ? "font-medium underline underline-offset-4" : "uppercase"}`}
            >
              {l.label}
            </span>
            <span className="text-xs tabular-nums text-mute transition-colors group-hover:text-charcoal">
              {l.count}
            </span>
          </Link>
        ))}
      </div>
    );
  };

  const genderList = (key: string) => (
    <div className="flex flex-col items-start gap-3">
      {genderLinks(key).map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="focus-kill group flex items-baseline gap-2 text-sm uppercase text-ink transition-colors hover:text-charcoal"
        >
          <span>{l.label}</span>
          <span className="text-xs tabular-nums text-mute transition-colors group-hover:text-charcoal">
            {l.count}
          </span>
        </Link>
      ))}
    </div>
  );

  return (
    <header className="sticky top-0 z-40 bg-canvas">
      <div className="hidden h-9 items-center justify-end gap-6 border-b border-hairline-soft bg-soft-cloud px-5 text-[12px] font-medium uppercase tracking-wide text-ink sm:flex sm:px-8">
        {UTILITY_LABELS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={showNotice}
            className="press focus-kill text-mute transition-colors hover:text-ink"
          >
            {t(`utility.${k}` as "utility.help")}
          </button>
        ))}
        <Link
          href={user ? "/account" : "/account/login"}
          className="press focus-kill text-mute transition-colors hover:text-ink"
        >
          {user ? t("auth.accountTitle") : t("auth.signIn")}
        </Link>
        <span className="h-3 w-px bg-hairline" aria-hidden="true" />
        <LangToggle />
      </div>

      <nav className="relative flex h-14 items-center justify-between border-b border-hairline-soft px-4 sm:px-8 lg:h-16">
        <div className="flex items-center gap-2 lg:gap-0">
          <button
            type="button"
            aria-label={t("nav.menu")}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="press focus-kill -ml-2 inline-flex h-10 w-10 items-center justify-center lg:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 7 H20 M4 12 H20 M4 17 H20" />
            </svg>
          </button>
          <Link href="/" className="focus-kill font-display text-[26px] leading-none tracking-tight text-ink transition-opacity hover:opacity-75">
            ABYSS
          </Link>
        </div>

        <div className="hidden items-center gap-8 lg:flex">
          {navRows.map((r) => {
            const active = activeLink === r.key;
            const open = openDd === r.key;
            return (
              <button
                key={r.key}
                type="button"
                aria-expanded={open}
                onMouseEnter={() => openDdHover(r.key)}
                onMouseLeave={scheduleDdClose}
                onClick={() => {
                  // Toggle on click too, so keyboard/mouse users can still
                  // cycle the flyout; the label still opens the category.
                  setOpenDd(open ? null : r.key);
                }}
                className={`press relative flex items-center gap-1.5 py-1 text-sm font-medium uppercase text-ink transition-colors hover:text-charcoal ${
                  active || open
                    ? "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-ink"
                    : "hover:after:absolute hover:after:inset-x-0 hover:after:bottom-0 hover:after:h-0.5 hover:after:bg-ink"
                }`}
              >
                {r.label}
                <ChevronDown open={open} />
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <form
            onSubmit={submit}
            className="hidden h-10 w-56 items-center gap-2 rounded-md bg-soft-cloud px-4 transition-colors focus-within:border focus-within:border-ink focus-within:bg-canvas md:flex"
          >
            <SearchIcon className="shrink-0 text-mute" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("nav.searchPlaceholder")}
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-mute"
            />
          </form>

          <button
            type="button"
            aria-label={t("nav.search")}
            onClick={() => {
              setSearchOpen((o) => !o);
            }}
            className="press focus-kill inline-flex h-10 w-10 items-center justify-center rounded-md text-ink md:hidden"
          >
            <SearchIcon />
          </button>

          <Link
            href="/wishlist"
            aria-label={t("wishlist.title")}
            title={t("wishlist.title")}
            className="press focus-kill inline-flex h-10 w-10 items-center justify-center text-ink"
          >
            <HeartIcon filled={wishCount > 0} />
          </Link>

          <button
            type="button"
            aria-label={t("nav.bag")}
            onClick={openCart}
            className="press focus-kill inline-flex h-10 w-10 items-center justify-center text-ink"
          >
            <BagIcon count={count} />
          </button>
        </div>

        {/* Desktop category flyout — shown on hover. `ddRef` + shared timer
            keep it open while the cursor is over either the trigger or the
            panel, and close it 120ms after both are left. */}
        {openDd ? (
          <div
            onMouseEnter={() => {
              if (closeDdTimer.current) {
                clearTimeout(closeDdTimer.current);
                closeDdTimer.current = null;
              }
            }}
            onMouseLeave={scheduleDdClose}
            className="absolute inset-x-0 top-full z-40 hidden border-b border-hairline-soft bg-canvas lg:block"
          >
            <div className="mx-auto grid max-w-6xl grid-cols-2 gap-16 px-8 py-9">
              <div>
                <h3 className="mb-4 text-xs font-medium uppercase tracking-wide text-mute">
                  {t("nav.shop")}
                </h3>
                {subList(openDd)}
              </div>
              <div>
                <h3 className="mb-4 text-xs font-medium uppercase tracking-wide text-mute">
                  {t("nav.designedFor")}
                </h3>
                {genderList(openDd)}
              </div>
            </div>
          </div>
        ) : null}
      </nav>

      {searchOpen ? (
        <div className="border-b border-hairline-soft px-4 py-3 md:hidden">
          <form
            onSubmit={submit}
            className="flex h-10 items-center gap-2 rounded-md bg-soft-cloud px-4"
          >
            <SearchIcon className="shrink-0 text-mute" />
            <input
              ref={searchInputRef}
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("nav.searchPlaceholder")}
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-mute"
            />
          </form>
        </div>
      ) : null}

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/30"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col bg-canvas">
            <div className="flex items-center justify-between border-b border-hairline-soft px-5 py-4">
              <span className="font-display text-xl tracking-tight text-ink">
                ABYSS
              </span>
              <button
                type="button"
                aria-label={t("nav.close")}
                onClick={() => setMenuOpen(false)}
                className="press focus-kill inline-flex h-10 w-10 items-center justify-center text-ink"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 6 L18 18 M18 6 L6 18" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6">
              <div>
                {navRows.map((r) => {
                  const active = activeLink === r.key;
                  const open = expandedRow === r.key;
                  return (
                    <div key={r.key} className="border-b border-hairline-soft">
                      <div className="flex items-center justify-between gap-3">
                        <Link
                          href={r.href}
                          onClick={() => setMenuOpen(false)}
                          className={`focus-kill py-4 text-2xl font-medium uppercase tracking-tight ${
                            active ? "text-ink underline underline-offset-8" : "text-ink hover:text-charcoal"
                          }`}
                        >
                          {r.label}
                        </Link>
                        <button
                          type="button"
                          aria-label={r.label}
                          aria-expanded={open}
                          onClick={() => setExpandedRow(open ? null : r.key)}
                          className="press focus-kill p-2 text-ink"
                        >
                          <ChevronDown open={open} />
                        </button>
                      </div>
                      {open ? (
                        <div className="flex flex-col items-start gap-3 pb-5 pl-3">
                          {r.key === "all" && (
                            <Link
                              href="/category/all"
                              onClick={() => setMenuOpen(false)}
                              className="focus-kill text-sm font-medium uppercase text-ink transition-colors hover:text-charcoal"
                            >
                              {t("nav.allShop")}
                            </Link>
                          )}
                          {shopLinks(r.key).map((l) => (
                            <Link
                              key={l.href}
                              href={l.href}
                              onClick={() => setMenuOpen(false)}
                              className={`focus-kill flex items-baseline gap-2 text-sm transition-colors hover:text-charcoal ${
                                l.primary
                                  ? "font-medium text-ink underline underline-offset-4"
                                  : "uppercase text-ink"
                              }`}
                            >
                              {l.label}
                              <span className="text-xs tabular-nums text-mute">
                                {l.count}
                              </span>
                            </Link>
                          ))}
                          <div className="mt-1 flex gap-3 border-t border-hairline-soft pt-3 text-xs font-medium uppercase tracking-wide text-mute">
                            {genderLinks(r.key).map((l) => (
                              <Link
                                key={l.href}
                                href={l.href}
                                onClick={() => setMenuOpen(false)}
                                className="focus-kill transition-colors hover:text-ink"
                              >
                                {l.label} ({l.count})
                              </Link>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <div className="mt-8 flex flex-col gap-3 text-sm font-medium uppercase tracking-wide text-mute">
                {UTILITY_LABELS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={showNotice}
                    className="press focus-kill self-start text-mute transition-colors hover:text-ink"
                  >
                    {t(`utility.${k}` as "utility.help")}
                  </button>
                ))}
                <Link
                  href={user ? "/account" : "/account/login"}
                  onClick={() => setMenuOpen(false)}
                  className="focus-kill self-start text-mute transition-colors hover:text-ink"
                >
                  {user ? t("auth.accountTitle") : t("auth.signIn")}
                </Link>
                <div className="mt-2 border-t border-hairline-soft pt-4">
                  <LangToggle column />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {notice ? (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-ink px-5 py-3 text-sm font-medium lowercase text-on-primary"
        >
          {t("utility.demoNotice")}
        </div>
      ) : null}
    </header>
  );
}