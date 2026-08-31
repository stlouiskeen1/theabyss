"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useAuth,
  validateEmail,
  validatePassword,
  validateSignupName,
} from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { ButtonLink } from "@/components/ui";
import { Chevron, Spinner } from "@/components/ui";

const fieldBase =
  "w-full rounded-md border border-hairline bg-canvas px-3.5 py-3 text-sm text-ink transition-colors focus-kill focus:border-ink";
const fieldErr = "!border-sale";
const labelCls = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-mute";
const errCls = "mt-1.5 text-xs text-sale";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { t } = useLang();
  const router = useRouter();
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resetKey, setResetKey] = useState(0);
  const [googleBusy, setGoogleBusy] = useState(false);

  // Demo "Continue with Google". In a real Supabase build this would kick off
  // the OAuth redirect; here it signs in immediately with a placeholder. A
  // short min-delay keeps the spinner visible so the async click never feels
  // like a dead/double tap.
  const google = () => {
    if (googleBusy) return;
    setErrors({});
    setGoogleBusy(true);
    const result = signInWithGoogle();
    if (result.ok) {
      window.setTimeout(() => {
        setGoogleBusy(false);
        router.push("/account");
      }, 500);
    } else {
      setGoogleBusy(false);
    }
  };

  const set = (key: "name" | "email" | "password" | "confirm") => (
    value: string
  ) => {
    if (key === "name") setName(value);
    if (key === "email") setEmail(value);
    if (key === "password") setPassword(value);
    if (key === "confirm") setConfirm(value);
    setErrors((e) => ({ ...e, [key]: "", global: "" }));
    void resetKey;
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();

    // Field-level validation (same standards as a real Supabase flow).
    const next: Record<string, string> = {};
    if (mode === "signup") {
      const n = validateSignupName(name);
      if (n) next.name = t(n as never);
    }
    const em = validateEmail(email);
    if (em) next.email = t(em as never);
    const pw = validatePassword(password);
    if (pw) next.password = t(pw as never);
    if (mode === "signup" && confirm !== password)
      next.confirm = t("auth.errConfirmMismatch");

    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    const result =
      mode === "signup"
        ? signUp(name, email, password)
        : signIn(email, password);

    if (!result.ok) {
      setErrors({ global: t(result.error as never) });
      // Force password inputs to clear so browsers don't leak them into the
      // account page for the next attempt.
      setPassword("");
      setConfirm("");
      setResetKey((k) => k + 1);
      return;
    }

    // Clear the form password state, then go to the account page.
    setPassword("");
    setConfirm("");
    router.push("/account");
  };

  const title = t(mode === "login" ? "auth.heroTitle" : "auth.signupHeroTitle");
  const sub = t(mode === "login" ? "auth.heroSub" : "auth.signupHeroSub");

  return (
    <div className="mx-auto w-full max-w-md px-5 py-12 sm:px-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-mute">
        <Link href="/" className="transition-colors hover:text-ink">
          {t("category.all")}
        </Link>
        <Chevron />
        <span className="text-ink">{title}</span>
      </div>

      <h1 className="mt-4 font-display text-4xl font-normal uppercase leading-[0.95] tracking-tight text-ink sm:text-5xl">
        {title}
      </h1>
      <p className="mt-3 max-w-[38ch] text-sm leading-6 text-charcoal">{sub}</p>

      <div className="mt-8 rounded-[18px] border border-hairline-soft bg-canvas p-6 sm:p-8">
        {/* Continue with Google */}
        <button
          type="button"
          onClick={google}
          disabled={googleBusy}
          aria-busy={googleBusy}
          className="press focus-kill inline-flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-hairline bg-canvas px-8 text-sm font-medium uppercase text-ink transition-colors hover:border-ink disabled:opacity-60"
        >
          {googleBusy ? (
            <Spinner />
          ) : (
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z" />
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 18.9 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.1 0-9.4-3.4-11-8l-6.4 5C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C36.9 40.2 44 35 44 24c0-1.3-.1-2.6-.4-3.9z" />
            </svg>
          )}
          {googleBusy ? t("auth.signingIn") : t("auth.google")}
        </button>

        <div className="my-6 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-hairline-soft" />
          <span className="text-xs font-medium uppercase tracking-wide text-mute">
            {t("auth.or")}
          </span>
          <span className="h-px flex-1 bg-hairline-soft" />
        </div>

        <form onSubmit={submit} noValidate={false} className="flex flex-col gap-4">
          {mode === "signup" && (
            <div>
              <label htmlFor="auth-name" className={labelCls}>
                {t("auth.name")}
              </label>
              <input
                id="auth-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => set("name")(e.target.value)}
                placeholder={t("auth.namePlaceholder")}
                className={`${fieldBase} ${errors.name ? fieldErr : ""}`}
              />
              {errors.name && <p className={errCls}>{errors.name}</p>}
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className={labelCls}>
              {t("auth.email")}
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => set("email")(e.target.value)}
              placeholder={t("auth.emailPlaceholder")}
              className={`${fieldBase} ${errors.email ? fieldErr : ""}`}
            />
            {errors.email && <p className={errCls}>{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="auth-password" className={labelCls}>
              {t("auth.password")}
            </label>
            <input
              key={`pw-${resetKey}`}
              id="auth-password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => set("password")(e.target.value)}
              placeholder={t("auth.passwordPlaceholder")}
              className={`${fieldBase} ${errors.password ? fieldErr : ""}`}
            />
            {mode === "signup" ? (
              <p className="mt-1.5 text-xs text-mute">{t("auth.passwordHint")}</p>
            ) : null}
            {errors.password && <p className={errCls}>{errors.password}</p>}
          </div>

          {mode === "signup" && (
            <div>
              <label htmlFor="auth-confirm" className={labelCls}>
                {t("auth.confirmPassword")}
              </label>
              <input
                key={`cf-${resetKey}`}
                id="auth-confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => set("confirm")(e.target.value)}
                placeholder={t("auth.confirmPasswordPlaceholder")}
                className={`${fieldBase} ${errors.confirm ? fieldErr : ""}`}
              />
              {errors.confirm && <p className={errCls}>{errors.confirm}</p>}
            </div>
          )}

          {errors.global && (
            <p role="alert" className="rounded-md bg-sale/5 px-3 py-2.5 text-sm text-sale">
              {errors.global}
            </p>
          )}

          <button
            type="submit"
            className="press focus-kill mt-1 h-12 w-full rounded-lg bg-ink px-8 text-sm font-medium uppercase text-canvas transition-colors hover:bg-charcoal"
          >
            {t(mode === "login" ? "auth.submit" : "auth.signupSubmit")}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-start gap-2 border-t border-hairline-soft pt-5 text-sm">
          {mode === "login" ? (
            <>
              <span className="text-mute">{t("auth.noAccount")}</span>
              <ButtonLink href="/account/signup" variant="ghost" className="w-full">
                {t("auth.createOne")}
              </ButtonLink>
            </>
          ) : (
            <>
              <span className="text-mute">{t("auth.haveAccount")}</span>
              <ButtonLink href="/account/login" variant="ghost" className="w-full">
                {t("auth.signInInstead")}
              </ButtonLink>
            </>
          )}
        </div>
      </div>

      <p className="mt-5 text-center text-xs leading-5 text-mute">
        {t("auth.demoNotice")}
      </p>
    </div>
  );
}