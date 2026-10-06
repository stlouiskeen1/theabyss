"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { WILAYAS_ALPHABETICAL } from "@/lib/wilayas";
import { clearDraft, loadDraft, saveDraft } from "@/lib/draft";
import { Spinner } from "@/components/ui";

function slugify(v: string) {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export default function ApplyView() {
  const { t } = useLang();
  const { user, loading } = useAuth();
  const router = useRouter();

  // Restore an in-progress application after any reload (see lib/draft).
  const [restored] = useState(() =>
    loadDraft<{
      name: string;
      slug: string;
      slugTouched: boolean;
      description: string;
      wilaya: string;
    }>("seller-apply")
  );
  const [name, setName] = useState(restored?.name ?? "");
  const [slug, setSlug] = useState(restored?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(restored?.slugTouched ?? false);
  const [description, setDescription] = useState(restored?.description ?? "");
  const [wilaya, setWilaya] = useState(restored?.wilaya ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Autosave the draft on every keystroke; cleared on successful submit.
  useEffect(() => {
    saveDraft("seller-apply", { name, slug, slugTouched, description, wilaya });
  }, [name, slug, slugTouched, description, wilaya]);

  useEffect(() => {
    if (!loading && !user) router.replace("/account/login?next=/seller/apply");
  }, [user, loading, router]);

  const onNameChange = (v: string) => {
    setName(v);
    if (!slugTouched) setSlug(slugify(v));
  };

  if (loading || !user) return <div className="min-h-[40vh]" />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    if (name.trim().length < 2) {
      setError(t("seller.apply.errName"));
      return;
    }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length < 3) {
      setError(t("seller.apply.errSlug"));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/seller/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          wilayaId: wilaya ? Number(wilaya) : null,
        }),
      });
      const text = await res.text();
      let data: { error?: string } | null = null;
      try {
        data = JSON.parse(text) as { error?: string };
      } catch {
        setError(`API error (${res.status}): ${text.slice(0, 140) || res.statusText}`);
        return;
      }
      if (!res.ok) {
        setError(
          data?.error === "slug_taken"
            ? t("seller.apply.errSlugTaken")
            : (data?.error ?? t("seller.apply.errUnexpected"))
        );
        return;
      }
      clearDraft("seller-apply");
      router.push("/seller/dashboard");
      router.refresh();
    } catch (e) {
      setError((e as Error).message || t("seller.apply.errUnexpected"));
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "h-12 w-full bg-surface-container-low text-primary px-unit-md rounded font-mono-technical text-mono-technical placeholder:text-text-muted/60 focus:outline-none focus:ring-1 focus:ring-primary";
  const labelCls =
    "font-label-caps-sm text-label-caps-sm text-text-muted uppercase tracking-widest";

  return (
    <div className="w-full px-margin-mobile md:px-margin-desktop py-unit-lg sm:py-unit-2xl">
      <div className="w-full max-w-2xl bg-surface-container-lowest rounded-xl shadow-xl p-unit-lg md:p-unit-2xl mx-auto">
        <span className="font-label-caps text-label-caps text-text-muted tracking-widest uppercase">
          {t("seller.apply.kicker")}
        </span>
        <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight mt-unit-2xs">
          {t("seller.apply.title")}
        </h1>
        <p className="font-body-editorial text-body-editorial text-text-muted mt-unit-2xs">
          {t("seller.apply.sub")}
        </p>

        <form onSubmit={submit} className="flex flex-col gap-unit-md mt-unit-lg">
          <label className="flex flex-col gap-unit-2xs">
            <span className={labelCls}>{t("seller.apply.name")}</span>
            <input
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder={t("seller.apply.namePlaceholder")}
              className={inputCls}
              required
              maxLength={80}
            />
          </label>
          <label className="flex flex-col gap-unit-2xs">
            <span className={labelCls}>{t("seller.apply.slug")}</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              placeholder="ma-boutique"
              className={inputCls}
              required
              minLength={3}
              maxLength={48}
            />
            <span className="font-mono-technical text-[11px] text-text-muted">
              /seller/{slug || "…"}
            </span>
          </label>
          <label className="flex flex-col gap-unit-2xs">
            <span className={labelCls}>{t("seller.apply.description")}</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("seller.apply.descriptionPlaceholder")}
              rows={4}
              maxLength={2000}
              className="w-full bg-surface-container-low text-primary px-unit-md py-unit-sm rounded font-body-utility text-body-utility placeholder:text-text-muted/60 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>
          <label className="flex flex-col gap-unit-2xs">
            <span className={labelCls}>{t("seller.apply.wilaya")}</span>
            <select
              value={wilaya}
              onChange={(e) => setWilaya(e.target.value)}
              className={inputCls}
            >
              <option value="">{t("seller.apply.wilayaPlaceholder")}</option>
              {WILAYAS_ALPHABETICAL.map((w) => (
                <option key={w.code} value={w.code}>
                  {w.code} — {w.name}
                </option>
              ))}
            </select>
          </label>

          {error && (
            <p role="alert" className="font-mono-technical text-mono-technical text-accent-crimson">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full h-12 bg-primary hover:bg-surface-charcoal text-on-primary font-label-caps text-label-caps uppercase tracking-wider rounded shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-unit-sm disabled:opacity-60"
          >
            {busy ? <Spinner /> : null}
            <span>{busy ? t("seller.apply.submitting") : t("seller.apply.submit")}</span>
          </button>

          <Link
            href="/seller/dashboard"
            className="font-mono-technical text-mono-technical text-text-muted hover:text-primary transition-colors uppercase tracking-wider text-center"
          >
            {t("seller.apply.haveShop")} →
          </Link>
        </form>
      </div>
    </div>
  );
}
