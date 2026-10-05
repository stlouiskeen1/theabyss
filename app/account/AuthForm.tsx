"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, type AuthResult } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { asset, placeholder } from "@/lib/mock";
import { Spinner } from "@/components/ui";

type Status =
  | { kind: "info"; text: string }
  | { kind: "success"; text: string }
  | { kind: "error"; text: string }
  | null;

function TrayGlyph({ kind }: { kind: "info" | "success" | "error" }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className={`flex-shrink-0 ${kind === "error" ? "text-accent-crimson" : ""}`}
      aria-hidden="true"
    >
      {kind === "success" ? (
        <path d="M5 13 L10 18 L19 7" />
      ) : kind === "error" ? (
        <g>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7 V13" />
          <path d="M12 16.5 V16.6" strokeLinecap="round" />
        </g>
      ) : (
        <g>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11 V17" strokeLinecap="round" />
          <path d="M12 7.4 V7.5" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { t } = useLang();
  const router = useRouter();
  const { signIn, signUp, signInGoogle, signUpGoogle, resetPassword } = useAuth();

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const showError = (error: string) => {
    setStatus({
      kind: "error",
      text: error.startsWith("auth.") ? t(error as never) : error,
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setStatus(null);

    if (mode === "signup") {
      if (name.trim().length < 2) {
        setStatus({ kind: "error", text: t("auth.errNameShort") });
        return;
      }
      if (password.length < 8) {
        setStatus({ kind: "error", text: t("auth.errPasswordMin") });
        return;
      }
      if (password !== confirm) {
        setStatus({ kind: "error", text: t("auth.errConfirmMismatch") });
        return;
      }
    }

    setBusy(true);
    const result: AuthResult =
      mode === "signup" ? await signUp(name.trim(), email.trim(), password) : await signIn(email.trim(), password);
    setBusy(false);
    if (!result.ok) {
      showError(result.error);
    } else {
      setStatus({
        kind: "success",
        text:
          mode === "signup"
            ? t("auth.statusSignupOk").replace("{email}", email.trim())
            : t("auth.statusSigninOk").replace("{email}", email.trim()),
      });
      router.push("/account");
      router.refresh();
    }
  };

  const google = async () => {
    if (busy) return;
    setBusy(true);
    const result = mode === "signup" ? await signUpGoogle() : await signInGoogle();
    if (!result.ok) {
      setBusy(false);
      showError(result.error);
    }
  };

  const forgot = async () => {
    if (!email.trim()) {
      setStatus({ kind: "error", text: t("auth.errEmailRequired") });
      return;
    }
    setBusy(true);
    const result = await resetPassword(email.trim());
    setBusy(false);
    if (!result.ok) showError(result.error);
    else
      setStatus({
        kind: "info",
        text: t("auth.statusRecoverySent").replace("{email}", email.trim()),
      });
  };

  const showLegal = (kind: "terms" | "privacy") => {
    setStatus({
      kind: "info",
      text: t(kind === "terms" ? "auth.termsNotice" : "auth.privacyNotice"),
    });
  };

  const signinTab = mode === "login";
  const activeTab =
    "py-unit-sm px-unit-md text-center rounded font-label-caps text-label-caps uppercase transition-all duration-200 bg-surface-paper text-primary shadow-sm";
  const idleTab =
    "py-unit-sm px-unit-md text-center rounded font-label-caps text-label-caps uppercase transition-all duration-200 text-text-muted hover:text-primary";

  const legal = t("auth.legal");
  const termsAt = legal.indexOf("{terms}");
  const privacyAt = legal.indexOf("{privacy}");
  const legalHead = termsAt >= 0 ? legal.slice(0, termsAt) : legal;
  const legalMid =
    termsAt >= 0 && privacyAt >= 0
      ? legal.slice(termsAt + "{terms}".length, privacyAt)
      : "";
  const legalTail =
    privacyAt >= 0 ? legal.slice(privacyAt + "{privacy}".length) : "";

  const inputCls =
    "h-12 w-full bg-surface-container-low text-primary px-unit-md rounded font-mono-technical text-mono-technical placeholder:text-text-muted/60 focus:outline-none focus:ring-1 focus:ring-primary";
  const labelCls =
    "font-label-caps-sm text-label-caps-sm text-text-muted uppercase tracking-widest";

  return (
    <div className="w-full px-margin-mobile md:px-margin-desktop py-unit-lg sm:py-unit-2xl">
      <div className="w-full max-w-[1040px] grid grid-cols-1 lg:grid-cols-12 bg-surface-paper shadow-xl rounded-xl overflow-hidden mx-auto">
        {/* Left editorial brand panel */}
        <aside className="hidden lg:flex lg:col-span-5 flex-col justify-between p-unit-2xl bg-surface-charcoal text-surface-paper relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary-container/40 to-transparent pointer-events-none"></div>

          <div className="relative z-10 flex items-center justify-between">
            <span className="font-label-caps text-label-caps text-surface-tint tracking-widest uppercase">
              {t("auth.clientPrivilege")}
            </span>
          </div>

          <div className="relative z-10 my-unit-2xl flex flex-col gap-unit-md">
            <div className="overflow-hidden rounded-lg aspect-[4/5] relative bg-primary-container shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset(
                  "category-apparel",
                  placeholder("abyss-auth-portal", 800, 1000)
                )}
                alt=""
                className="w-full h-full object-cover grayscale brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-charcoal via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-surface-paper">
                <span className="font-mono-technical text-mono-technical tracking-widest uppercase">
                  {t("auth.panelCity")}
                </span>
                <span className="font-label-caps-sm text-label-caps-sm uppercase bg-surface-paper text-primary px-unit-xs py-unit-2xs">
                  {t("auth.exclusiveIndex")}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-unit-xs">
              <p className="font-headline-sm text-headline-sm tracking-tight text-surface-paper uppercase">
                {t("auth.panelTitle")}
              </p>
              <p className="font-body-utility text-body-utility text-surface-tint">
                {t("auth.panelBody")}
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between pt-unit-md border-t border-primary-container">
            <div className="flex items-center gap-unit-xs">
              <span className="w-2 h-2 rounded-full bg-status-cod animate-pulse"></span>
              <span className="font-mono-technical text-mono-technical text-surface-tint">
                {t("auth.systemOnline")}
              </span>
            </div>
            <span className="font-label-caps-sm text-label-caps-sm text-surface-tint tracking-widest">
              {t("auth.tls")}
            </span>
          </div>
        </aside>

        {/* Right authentication monolith */}
        <div className="col-span-1 lg:col-span-7 flex flex-col justify-center p-unit-lg sm:p-unit-2xl bg-surface-paper">
          <div className="w-full max-w-[480px] mx-auto flex flex-col gap-unit-lg">
            <div className="flex flex-col gap-unit-sm">
              <div className="flex items-center gap-unit-xs">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                <span className="font-label-caps-sm text-label-caps-sm text-text-muted uppercase tracking-widest">
                  {t("auth.portalEntry")}
                </span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight uppercase">
                {t("auth.cardTitle")}
              </h1>
              <p className="font-body-editorial text-body-editorial text-text-muted">
                {t("auth.cardSub")}
              </p>
            </div>

            {/* Mode toggle segmented control */}
            <div className="grid grid-cols-2 p-1 bg-surface-canvas rounded-lg">
              <Link
                href="/account/login"
                aria-current={signinTab ? "page" : undefined}
                className={signinTab ? activeTab : idleTab}
              >
                {t("auth.signIn")}
              </Link>
              <Link
                href="/account/signup"
                aria-current={signinTab ? undefined : "page"}
                className={signinTab ? idleTab : activeTab}
              >
                {t("auth.signUp")}
              </Link>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-unit-sm">
              {mode === "signup" && (
                <label className="flex flex-col gap-unit-2xs">
                  <span className={labelCls}>{t("auth.fullName")}</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("auth.fullNamePlaceholder")}
                    className={inputCls}
                    autoComplete="name"
                    required
                  />
                </label>
              )}
              <label className="flex flex-col gap-unit-2xs">
                <span className={labelCls}>{t("auth.emailLabel")}</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.emailPlaceholder")}
                  className={inputCls}
                  autoComplete="email"
                  required
                />
              </label>
              <label className="flex flex-col gap-unit-2xs">
                <span className={labelCls}>{t("auth.password")}</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth.passwordPlaceholder")}
                  className={inputCls}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  required
                  minLength={8}
                />
              </label>
              {mode === "signup" && (
                <label className="flex flex-col gap-unit-2xs">
                  <span className={labelCls}>{t("auth.confirmPassword")}</span>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder={t("auth.confirmPasswordPlaceholder")}
                    className={inputCls}
                    autoComplete="new-password"
                    required
                    minLength={8}
                  />
                </label>
              )}
              <button
                type="submit"
                disabled={busy}
                aria-busy={busy}
                className="w-full h-12 bg-primary hover:bg-surface-charcoal text-on-primary font-label-caps text-label-caps uppercase tracking-wider rounded shadow-md transition-all duration-150 active:scale-[0.99] flex items-center justify-center gap-unit-sm press focus-kill disabled:opacity-60"
              >
                {busy ? <Spinner /> : null}
                <span>{busy ? t("auth.signingIn") : t(mode === "signup" ? "auth.signupSubmit" : "auth.submit")}</span>
              </button>
              {mode === "login" && (
                <button
                  type="button"
                  onClick={forgot}
                  className="self-end font-mono-technical text-mono-technical text-text-muted hover:text-primary uppercase tracking-wider"
                >
                  {t("auth.forgot")}
                </button>
              )}
            </form>

            <div className="flex items-center gap-unit-sm text-text-muted">
              <span className="h-px flex-1 bg-surface-container"></span>
              <span className="font-label-caps-sm text-label-caps-sm uppercase">{t("auth.orEmail")}</span>
              <span className="h-px flex-1 bg-surface-container"></span>
            </div>

            <button
              type="button"
              disabled={busy}
              aria-busy={busy}
              onClick={google}
              className="w-full h-12 bg-white hover:bg-surface-canvas text-primary border border-surface-container font-label-caps text-label-caps uppercase tracking-wider rounded shadow-sm transition-all duration-150 active:scale-[0.99] flex items-center justify-center gap-unit-sm press focus-kill disabled:opacity-60"
            >
              {busy ? (
                <Spinner />
              ) : (
                <svg
                  aria-hidden="true"
                  className="h-[18px] w-[18px] shrink-0"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              <span>
                {busy
                  ? t("auth.signingIn")
                  : t(mode === "signup" ? "auth.continueGoogleSignup" : "auth.continueGoogle")}
              </span>
            </button>

            {/* Feedback tray — errors / notice summaries only */}
            {status && (
              <div
                role={status.kind === "error" ? "alert" : "status"}
                className="p-unit-sm rounded bg-surface-container text-primary font-mono-technical text-mono-technical flex items-center gap-unit-sm"
              >
                <TrayGlyph kind={status.kind} />
                <span>{status.text}</span>
              </div>
            )}

            {/* Compliance & legal disclaimer */}
            <p className="font-body-utility text-[11px] leading-relaxed text-text-muted text-center pt-unit-2xs">
              {legalHead}
              <button
                type="button"
                onClick={() => showLegal("terms")}
                className="underline hover:text-primary transition-colors press focus-kill"
              >
                {t("auth.terms")}
              </button>
              {legalMid}
              <button
                type="button"
                onClick={() => showLegal("privacy")}
                className="underline hover:text-primary transition-colors press focus-kill"
              >
                {t("auth.privacy")}
              </button>
              {legalTail}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
