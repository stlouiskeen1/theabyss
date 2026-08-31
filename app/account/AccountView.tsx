"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { ButtonLink } from "@/components/ui";
import { Chevron } from "@/components/ui";

export default function AccountView() {
  const { t } = useLang();
  const { user, signOut } = useAuth();
  const router = useRouter();

  // The session is restored in an effect right after mount (see lib/auth).
  // Once it settles, send logged-out visitors to the sign-in page.
  useEffect(() => {
    if (user === null) {
      router.replace("/account/login");
    }
  }, [user, router]);

  if (!user) {
    // Brief empty frame while the redirect fires (avoids a flash of content).
    return <div className="min-h-[40vh] px-5 py-12 sm:px-8" />;
  }

  return (
    <div className="mx-auto w-full max-w-md px-5 py-12 sm:px-8">
      <div className="flex items-center gap-2 text-xs text-mute">
        <Link href="/" className="transition-colors hover:text-ink">
          {t("category.all")}
        </Link>
        <Chevron />
        <span className="text-ink">{t("auth.accountTitle")}</span>
      </div>

      <h1 className="mt-4 font-display text-4xl font-normal uppercase leading-[0.95] tracking-tight text-ink sm:text-5xl">
        {t("auth.welcome", { name: user.name })}
      </h1>

      <div className="mt-8 rounded-[18px] border border-hairline-soft bg-canvas p-6 sm:p-8">
        <p className="text-sm text-mute">{t("auth.signedInAs", { name: user.name })}</p>
        <p className="mt-1 text-base font-medium text-ink" data-testid="account-email">
          {user.email}
        </p>

        <div className="mt-6 border-t border-hairline-soft pt-5">
          <p className="text-sm leading-6 text-mute">{t("auth.demoHint")}</p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <ButtonLink href="/category/all" variant="primary" className="w-full">
            {t("auth.shopNow")}
          </ButtonLink>
          <ButtonLink href="/wishlist" variant="secondary" className="w-full">
            {t("wishlist.title")}
          </ButtonLink>
          <ButtonLink href="/checkout" variant="secondary" className="w-full">
            {t("auth.checkoutNow")}
          </ButtonLink>
          <button
            type="button"
            onClick={() => {
              signOut();
              router.replace("/");
            }}
            className="press focus-kill mt-1 h-12 w-full rounded-lg border border-hairline bg-canvas px-8 text-sm font-medium uppercase text-ink transition-colors hover:border-ink"
          >
            {t("auth.signOut")}
          </button>
        </div>
      </div>

      <p className="mt-5 text-center text-xs leading-5 text-mute">
        {t("auth.demoNotice")}
      </p>
    </div>
  );
}