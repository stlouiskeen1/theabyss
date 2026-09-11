"use client";

import { useState } from "react";
import Link from "next/link";
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

// Official Auth0 mark (2021 symbol), embedded from the brand SVG.
function Auth0Mark() {
  return (
    <svg
      aria-hidden="true"
      className="h-[18px] w-[18px] shrink-0"
      viewBox="-197 -54 736 736"
      fill="none"
    >
      <path
        fill="#EB5424"
        d="M360.33484 536.48447 288.0367 314 477.35347 176.48447c46.58386 142.73292 0 275.03106-117.01863 360zm117.01863-360L405.05534-46H171.01807l71.92547 222.48447c0 0 234.40993 0 234.40993 0zM171.01807-46H-63.019202L-134.94466 176.48447H99.092595zm-306.3354 222.48447c-46.21118 142.73292 0 275.03106 117.018625 360L53.626761 314zm117.018625 360L171.01807 674 360.33484 536.48447 171.01807 398.96894z"
      />
    </svg>
  );
}

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { t } = useLang();
  const { signIn, signUp } = useAuth();

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  // Both paths lead to Auth0's hosted Universal Login page, so this starts a
  // full-page OAuth redirect instead of submitting an in-app form.
  const go = (action: () => AuthResult) => {
    if (busy) return;
    setBusy(true);
    const result = action();
    if (!result.ok) {
      setBusy(false);
      setStatus({ kind: "error", text: t(result.error as never) });
    }
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
            <Auth0Mark />
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

            {/* Primary Auth0 CTA — opens the hosted sign-in / sign-up flow */}
            <div className="flex flex-col gap-unit-sm">
              <button
                type="button"
                disabled={busy}
                aria-busy={busy}
                onClick={() => go(mode === "signup" ? signUp : signIn)}
                className="w-full h-12 bg-primary hover:bg-surface-charcoal text-on-primary font-label-caps text-label-caps uppercase tracking-wider rounded shadow-md transition-all duration-150 active:scale-[0.99] flex items-center justify-center gap-unit-sm press focus-kill disabled:opacity-60"
              >
                {busy ? (
                  <Spinner />
                ) : (
                  <Auth0Mark />
                )}
                <span>
                  {busy
                    ? t("auth.signingIn")
                    : t(
                        mode === "signup"
                          ? "auth.continueAuth0Signup"
                          : "auth.continueAuth0"
                      )}
                </span>
              </button>
              <p className="font-body-utility text-body-utility text-text-muted text-center leading-relaxed">
                {t("auth.hostedNote")}
              </p>
            </div>

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