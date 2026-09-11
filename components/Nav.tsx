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
import {
  BagIcon,
  CloseIcon,
  HeartGlyph,
  MenuIcon,
  PersonIcon,
  SearchIcon,
} from "@/components/ui";

const UTILITY_LABELS = ["seller", "help", "join"] as const;
const GENDERS = ["WOMEN", "MEN"] as const;

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

const LANG_PILL_ACTIVE =
  "px-unit-sm py-unit-2xs bg-primary text-on-primary font-label-caps-sm text-label-caps-sm uppercase leading-none";
const LANG_PILL_IDLE =
  "px-unit-sm py-unit-2xs text-text-muted hover:text-primary font-label-caps-sm text-label-caps-sm uppercase leading-none";

function LangToggle({ column = false }: { column?: boolean }) {
  const { lang, setLang } = useLang();
  return (
    <div
      className={`flex items-center border border-border-rule p-unit-2xs ${
        column ? "" : ""
      }`}
    >
      <span className="sr-only">Language / Langue</span>
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          aria-pressed={lang === l.code}
          className={`focus-kill transition-colors ${
            lang === l.code ? LANG_PILL_ACTIVE : LANG_PILL_IDLE
          } ${column ? "w-14 justify-center" : ""}`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

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
            className="focus-kill group flex items-baseline gap-2 text-sm text-primary transition-colors hover:text-accent-crimson"
          >
            <span
              className={`${l.primary ? "font-bold underline underline-offset-4" : "uppercase"}`}
            >
              {l.label}
            </span>
            <span className="text-xs tabular-nums text-text-muted transition-colors group-hover:text-primary">
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
          className="focus-kill group flex items-baseline gap-2 text-sm uppercase text-primary transition-colors hover:text-accent-crimson"
        >
          <span>{l.label}</span>
          <span className="text-xs tabular-nums text-text-muted transition-colors group-hover:text-primary">
            {l.count}
          </span>
        </Link>
      ))}
    </div>
  );

  const navLink = (r: Row) => {
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
          setOpenDd(open ? null : r.key);
        }}
        className={`focus-kill relative flex h-full items-center gap-1.5 pt-1 font-label-caps text-label-caps uppercase tracking-wider transition-colors ${
          active || open
            ? "border-b-2 border-primary text-primary font-bold"
            : "text-text-muted hover:text-primary"
        }`}
      >
        {r.label}
        <ChevronDown open={open} />
      </button>
    );
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50 w-full bg-surface-paper">
      {/* Announcement / utility bar */}
      <div className="hidden h-8 items-center justify-between border-b border-border-dark bg-surface-charcoal px-margin-desktop font-label-caps-sm text-label-caps-sm text-surface-canvas sm:flex">
        <div className="flex items-center gap-unit-md uppercase">
          <span className="inline-block h-1.5 w-1.5 bg-accent-crimson" />
          <span>{t("nav.utilityShipping")}</span>
        </div>
        <div className="flex items-center gap-unit-lg uppercase text-surface-container-highest">
          <span className="text-label-caps-sm font-mono-technical">
            {t("nav.utilityRates")}
          </span>
          <Link href="/ops" className="font-bold text-surface-canvas transition-colors hover:text-accent-crimson">
            {t("nav.ops")}
          </Link>
          <span className="font-bold text-surface-canvas">
            {t("nav.utilityFree")}
          </span>
        </div>
      </div>

      {/* Main bar */}
      <div className="h-16 border-b border-border-rule bg-surface-paper px-margin-mobile sm:px-margin-desktop">
        <div className="flex h-full w-full items-center justify-between">
          <div className="flex items-center gap-unit-md lg:gap-unit-xl">
            <button
              type="button"
              aria-label={t("nav.menu")}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
              className="press focus-kill -ml-2 inline-flex h-10 w-10 items-center justify-center text-primary lg:hidden"
            >
              <MenuIcon />
            </button>
            <Link
              href="/"
              className="focus-kill select-none font-display-hero text-headline-sm uppercase tracking-tighter text-primary transition-opacity hover:opacity-75"
            >
              ABYSS
            </Link>
            <span className="hidden border-l border-border-rule pl-unit-md font-label-caps-sm text-label-caps-sm uppercase text-text-muted xl:inline-block">
              {t("nav.tagline")}
            </span>
          </div>

          <nav
            className="hidden h-full items-center gap-unit-lg lg:flex"
            aria-label={t("nav.shop")}
          >
            {navRows.map(navLink)}
          </nav>

          <div className="flex items-center gap-unit-sm lg:gap-unit-md">
            <div className="hidden md:flex">
              <LangToggle />
            </div>
            <div className="hidden items-center gap-unit-xs border border-border-rule bg-surface-canvas px-unit-sm py-1 font-mono-technical text-mono-technical text-primary md:flex">
              <span className="inline-block h-1.5 w-1.5 bg-status-cod" />
              <span className="uppercase font-bold tracking-wider">
                {t("nav.wilayaCode")}
              </span>
              <span className="text-label-caps-sm text-text-muted">
                {t("nav.wilayaUnit")}
              </span>
            </div>

            <button
              type="button"
              aria-label={t("nav.searchArchive")}
              aria-expanded={searchOpen}
              onClick={() => {
                setSearchOpen((o) => !o);
                if (!searchOpen) {
                  window.setTimeout(
                    () => searchInputRef.current?.focus(),
                    50
                  );
                }
              }}
              className="press focus-kill flex h-9 w-9 items-center justify-center border border-border-rule text-primary transition-colors hover:bg-surface-canvas lg:w-fit lg:gap-unit-xs lg:px-unit-sm"
            >
              <SearchIcon className="h-[18px] w-[18px]" />
              <span className="hidden font-label-caps-sm text-label-caps-sm uppercase tracking-wider lg:inline">
                {t("nav.search")}
              </span>
            </button>

            <Link
              href="/wishlist"
              aria-label={t("wishlist.title")}
              title={t("wishlist.title")}
              className="press focus-kill relative flex h-9 w-9 items-center justify-center border border-border-rule text-primary transition-colors hover:bg-surface-canvas"
            >
              <HeartGlyph size={18} filled={wishCount > 0} />
              {wishCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center bg-accent-crimson font-mono-technical text-[9px] leading-none text-on-error">
                  {wishCount}
                </span>
              ) : null}
              <span className="sr-only">{wishCount}</span>
            </Link>

            <button
              type="button"
              aria-label={t("nav.bag")}
              onClick={openCart}
              className="press focus-kill flex h-9 items-center gap-unit-xs border border-border-rule px-unit-sm text-primary transition-colors hover:bg-surface-canvas"
            >
              <BagIcon count={count} />
              <span className="hidden font-mono-technical text-mono-technical font-bold sm:inline">
                {count}
              </span>
            </button>

            <Link
              href={user ? "/account" : "/account/login"}
              aria-label={user ? t("auth.accountTitle") : t("auth.signIn")}
              className="focus-kill flex items-center pl-unit-xs"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                <PersonIcon size={18} className="text-on-primary" />
              </span>
            </Link>
          </div>
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
            className="absolute inset-x-0 top-full z-40 hidden border-b border-border-rule bg-surface-paper lg:block"
          >
            <div className="mx-auto grid max-w-6xl grid-cols-2 gap-16 px-margin-desktop py-unit-xl">
              <div>
                <h3 className="mb-4 font-label-caps-sm text-label-caps-sm uppercase tracking-wider text-text-muted">
                  {t("nav.shop")}
                </h3>
                {subList(openDd)}
              </div>
              <div>
                <h3 className="mb-4 font-label-caps-sm text-label-caps-sm uppercase tracking-wider text-text-muted">
                  {t("nav.designedFor")}
                </h3>
                {genderList(openDd)}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {searchOpen ? (
        <div className="border-b border-border-rule bg-surface-canvas px-margin-mobile py-unit-sm sm:px-margin-desktop">
          <form
            onSubmit={submit}
            className="flex h-11 items-center gap-unit-sm border-b border-primary bg-surface-paper px-unit-md"
          >
            <SearchIcon className="shrink-0 text-primary" />
            <input
              ref={searchInputRef}
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("nav.searchPlaceholder")}
              className="w-full bg-transparent font-mono-technical text-mono-technical uppercase text-primary outline-none placeholder:text-text-muted"
            />
            <button
              type="button"
              aria-label={t("nav.close")}
              onClick={() => setSearchOpen(false)}
              className="press focus-kill text-primary"
            >
              <CloseIcon className="h-[18px] w-[18px]" />
            </button>
          </form>
        </div>
      ) : null}

      {/* Mobile drawer */}
      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/30"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col bg-surface-paper">
            <div className="flex items-center justify-between border-b border-border-rule px-5 py-4">
              <span className="select-none font-display-hero text-headline-sm uppercase tracking-tighter text-primary">
                ABYSS
              </span>
              <button
                type="button"
                aria-label={t("nav.close")}
                onClick={() => setMenuOpen(false)}
                className="press focus-kill flex h-10 w-10 items-center justify-center text-primary"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6">
              <div>
                {navRows.map((r) => {
                  const active = activeLink === r.key;
                  const open = expandedRow === r.key;
                  return (
                    <div key={r.key} className="border-b border-border-rule">
                      <div className="flex items-center justify-between gap-3">
                        <Link
                          href={r.href}
                          onClick={() => setMenuOpen(false)}
                          className={`focus-kill py-4 text-2xl font-medium uppercase tracking-tight ${
                            active
                              ? "text-primary underline underline-offset-8"
                              : "text-primary hover:text-accent-crimson"
                          }`}
                        >
                          {r.label}
                        </Link>
                        <button
                          type="button"
                          aria-label={r.label}
                          aria-expanded={open}
                          onClick={() => setExpandedRow(open ? null : r.key)}
                          className="press focus-kill p-2 text-primary"
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
                              className="focus-kill text-sm font-bold uppercase text-primary transition-colors hover:text-accent-crimson"
                            >
                              {t("nav.allShop")}
                            </Link>
                          )}
                          {shopLinks(r.key).map((l) => (
                            <Link
                              key={l.href}
                              href={l.href}
                              onClick={() => setMenuOpen(false)}
                              className={`focus-kill flex items-baseline gap-2 text-sm transition-colors hover:text-accent-crimson ${
                                l.primary
                                  ? "font-bold text-primary underline underline-offset-4"
                                  : "uppercase text-primary"
                              }`}
                            >
                              {l.label}
                              <span className="text-xs tabular-nums text-text-muted">
                                {l.count}
                              </span>
                            </Link>
                          ))}
                          <div className="mt-1 flex gap-3 border-t border-border-rule pt-3 font-label-caps-sm text-label-caps-sm uppercase tracking-wider text-text-muted">
                            {genderLinks(r.key).map((l) => (
                              <Link
                                key={l.href}
                                href={l.href}
                                onClick={() => setMenuOpen(false)}
                                className="focus-kill transition-colors hover:text-primary"
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
              <div className="mt-8 flex flex-col gap-3 text-sm font-medium uppercase tracking-wide text-text-muted">
                {UTILITY_LABELS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={showNotice}
                    className="press focus-kill self-start text-text-muted transition-colors hover:text-primary"
                  >
                    {t(`utility.${k}` as "utility.help")}
                  </button>
                ))}
                <Link
                  href={user ? "/account" : "/account/login"}
                  onClick={() => setMenuOpen(false)}
                  className="focus-kill self-start text-text-muted transition-colors hover:text-primary"
                >
                  {user ? t("auth.accountTitle") : t("auth.signIn")}
                </Link>
                <div className="mt-2 border-t border-border-rule pt-4">
                  <LangToggle />
                </div>
                <Link
                  href="/ops"
                  onClick={() => setMenuOpen(false)}
                  className="focus-kill self-start text-text-muted transition-colors hover:text-primary"
                >
                  {t("nav.ops")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {notice ? (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 border border-border-dark bg-surface-charcoal px-5 py-3 font-label-caps text-label-caps uppercase tracking-wider text-surface-canvas shadow-md"
        >
          {t("utility.demoNotice")}
        </div>
      ) : null}
    </header>
  );
}