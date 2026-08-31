"use client";

import Link from "next/link";
import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

type Variant = "primary" | "secondary" | "on-image" | "ghost";

const BUTTON_VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-on-primary hover:bg-charcoal",
  secondary: "bg-soft-cloud text-ink hover:bg-hairline",
  "on-image": "bg-canvas text-ink hover:bg-soft-cloud",
  ghost: "bg-transparent text-ink hover:text-charcoal underline-offset-4",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
}) {
  return (
    <button
      className={`press focus-kill inline-flex h-12 items-center justify-center rounded-lg px-8 text-sm font-medium lowercase transition-colors ${BUTTON_VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  className = "",
  onClick,
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`press focus-kill inline-flex h-12 items-center justify-center rounded-lg px-8 text-sm font-medium lowercase transition-colors ${BUTTON_VARIANTS[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}

export function Chip({
  active = false,
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      aria-pressed={active}
      className={`press focus-kill inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border px-5 text-sm font-medium transition-colors ${
        active
          ? "border-ink bg-ink text-on-primary"
          : "border-hairline bg-canvas text-ink hover:border-ink"
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function IconButton({
  label,
  children,
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`press focus-kill inline-flex h-10 w-10 items-center justify-center rounded-full bg-soft-cloud text-ink transition-colors hover:bg-hairline ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function SwatchDot({
  color,
  active = false,
  label,
  onClick,
}: {
  color: string;
  active?: boolean;
  label: string;
  onClick?: () => void;
}) {
  const inner = (
    <span
      className={`block h-3.5 w-3.5 rounded-full transition-all ${
        active ? "ring-ink ring-2 ring-offset-2" : "ring-0"
      }`}
      style={{
        background: color,
        boxShadow:
          color === "#ffffff" || color === "#f5f5f5"
            ? "inset 0 0 0 1px #cacacb"
            : undefined,
      }}
    />
  );
  if (onClick) {
    return (
      <button
        type="button"
        aria-label={label}
        aria-pressed={active}
        onClick={onClick}
        className="press focus-kill rounded-full p-0.5"
      >
        {inner}
      </button>
    );
  }
  return <span aria-label={label}>{inner}</span>;
}

export function SectionHeader({
  title,
  viewAllHref,
  viewAllLabel,
  trailing,
}: {
  title: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 sm:px-8">
      <h2 className="font-medium uppercase leading-[1.2] tracking-tight text-ink text-2xl sm:text-[32px]">
        {title}
      </h2>
      <div className="flex items-center gap-5">
        {trailing}
        {viewAllHref && viewAllLabel ? (
          <Link
            href={viewAllHref}
            className="text-sm font-medium uppercase text-ink underline underline-offset-4 transition-colors hover:text-charcoal"
          >
            {viewAllLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function Chevron({ open }: { open?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={`transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="M6 9 L12 15 L18 9" />
    </svg>
  );
}

export function BagIcon({ count }: { count?: number }) {
  return (
    <span className="relative inline-flex">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M5 8 H19 L18.2 21 H5.8 L5 8 Z" />
        <path d="M8.5 8 V6.5 a3.5 3.5 0 0 1 7 0 V8" />
      </svg>
      {count != null && count > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[9px] font-medium leading-none text-on-primary">
          {count}
        </span>
      ) : null}
    </span>
  );
}

export function HeartIcon({
  filled = false,
  className = "",
}: {
  filled?: boolean;
  className?: string;
}) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
    >
      <path d="M12 20.5 C 12 20.5 3.5 15.2 3.5 9.6 C 3.5 6.7 5.7 4.8 8 4.8 c 1.7 0 3.1 0.9 4 2.3 c 0.9 -1.4 2.3 -2.3 4 -2.3 c 2.3 0 4.5 1.9 4.5 4.8 c 0 5.6 -8.5 10.9 -8.5 10.9 Z" />
    </svg>
  );
}

export function WishlistButton({
  active,
  label,
  onClick,
  className = "",
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`press focus-kill inline-flex h-10 w-10 items-center justify-center rounded-full border bg-canvas transition-colors hover:border-ink ${
        active ? "border-ink text-sale" : "border-hairline text-ink"
      } ${className}`}
    >
      <HeartIcon filled={active} />
    </button>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`animate-spin ${className}`}
      style={{ animationDuration: "700ms" }}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="2"
      />
      <path
        d="M21 12 a9 9 0 0 0 -9 -9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20 L15.5 15.5" />
    </svg>
  );
}