"use client";

import { useLang } from "@/lib/i18n";

/**
 * Checkout progress stepper — steps mirror the Stitch cart/checkout design.
 * 1 Bag & Boutiques · 2 Delivery & Wilaya · 3 Payment · 4 Confirmation
 */
export default function CheckoutStepper({ activeStep }: { activeStep: number }) {
  const { t } = useLang();
  const steps = [
    { n: 1, label: t("cart.step1") },
    { n: 2, label: t("cart.step2") },
    { n: 3, label: t("cart.step3") },
    { n: 4, label: t("cart.step4") },
  ];

  return (
    <nav
      aria-label="Purchase steps"
      className="flex items-center flex-wrap gap-unit-xs sm:gap-unit-sm"
    >
      {steps.map((step, i) => {
        const state =
          step.n === activeStep
            ? "bg-accent-crimson text-on-error"
            : step.n < activeStep
              ? "bg-surface-charcoal text-surface-paper"
              : "bg-surface-container-high text-text-muted";
        return (
          <span key={step.n} className="flex items-center gap-unit-xs sm:gap-unit-sm">
            {i > 0 ? (
              <span className="text-text-muted font-mono-technical text-label-caps-sm">
                →
              </span>
            ) : null}
            <div
              className={`flex items-center gap-unit-xs px-unit-sm py-1 font-label-caps-sm text-label-caps-sm uppercase ${state}`}
            >
              <span className="font-mono-technical">
                {String(step.n).padStart(2, "0")}
              </span>
              <span>{step.label}</span>
            </div>
          </span>
        );
      })}
    </nav>
  );
}