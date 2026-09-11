"use client";

import Link from "next/link";
import type {
  ButtonHTMLAttributes,
  ReactNode,
  SVGProps,
} from "react";

type Variant = "primary" | "secondary" | "on-image" | "ghost";

const BUTTON_VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary text-on-primary hover:bg-surface-charcoal shadow-sm active:scale-[0.99]",
  secondary:
    "bg-surface-paper text-primary ring-1 ring-border-rule hover:ring-primary hover:bg-surface-canvas shadow-sm",
  "on-image": "bg-surface-paper text-primary hover:bg-surface-canvas shadow-sm",
  ghost: "bg-transparent text-primary hover:text-accent-crimson",
};

const BASE =
  "press focus-kill inline-flex h-12 items-center justify-center gap-unit-xs px-unit-xl font-label-caps text-label-caps uppercase tracking-wider transition-all duration-150";

export function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button className={`${BASE} ${BUTTON_VARIANTS[variant]} ${className}`} {...rest}>
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
      className={`${BASE} ${BUTTON_VARIANTS[variant]} ${className}`}
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
      className={`press focus-kill inline-flex h-10 items-center justify-center gap-1.5 px-unit-md font-label-caps text-label-caps uppercase tracking-wider shadow-sm transition-all ${
        active
          ? "bg-border-dark text-surface-paper"
          : "bg-surface-paper text-primary hover:bg-surface-container-high"
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
      className={`press focus-kill inline-flex h-10 w-10 items-center justify-center border border-border-rule bg-surface-paper text-primary transition-colors hover:bg-surface-canvas ${className}`}
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
      className={`block h-6 w-6 transition-all ${
        active ? "ring-primary ring-2 ring-inset" : ""
      }`}
      style={{
        background: color,
        boxShadow:
          color === "#ffffff" || color === "#f5f5f5" || color === "#E8E6E1"
            ? "inset 0 0 0 1px #c4c7c7"
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
        className={`press focus-kill p-2 ${active ? "bg-surface-container ring-primary ring-2" : "bg-surface-container ring-border-rule ring-1 hover:ring-primary"}`}
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
    <div className="flex flex-col gap-unit-sm sm:flex-row sm:items-end sm:justify-between sm:gap-4 px-margin-mobile sm:px-margin-desktop">
      <h2 className="font-headline-lg text-headline-lg uppercase tracking-tight text-primary">
        {title}
      </h2>
      <div className="flex items-center gap-5">
        {trailing}
        {viewAllHref && viewAllLabel ? (
          <Link
            href={viewAllHref}
            className="font-label-caps text-label-caps uppercase tracking-wider text-primary transition-colors hover:text-accent-crimson"
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

function PathIcon({
  size = 18,
  className = "",
  children,
  ...rest
}: SVGProps<SVGSVGElement> & { size?: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...rest}
    >
      {children}
    </svg>
  );
}

export function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <PathIcon className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20 L15.5 15.5" />
    </PathIcon>
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
    <path
      d="M12 20.5 C 12 20.5 3.5 15.2 3.5 9.6 C 3.5 6.7 5.7 4.8 8 4.8 c 1.7 0 3.1 0.9 4 2.3 c 0.9 -1.4 2.3 -2.3 4 -2.3 c 2.3 0 4.5 1.9 4.5 4.8 c 0 5.6 -8.5 10.9 -8.5 10.9 Z"
      fill={filled ? "currentColor" : "none"}
      className={className}
    />
  );
}

export function HeartGlyph({
  filled = false,
  className = "",
  size = 18,
}: {
  filled?: boolean;
  className?: string;
  size?: number;
}) {
  return (
    <PathIcon size={size} className={className}>
      <HeartIcon filled={filled} />
    </PathIcon>
  );
}

export function BagIcon({ count }: { count?: number }) {
  return (
    <span className="relative inline-flex">
      <PathIcon size={22}>
        <path d="M5 8 H19 L18.2 21 H5.8 L5 8 Z" />
        <path d="M8.5 8 V6.5 a3.5 3.5 0 0 1 7 0 V8" />
      </PathIcon>
      {count != null && count > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center bg-accent-crimson px-1 text-[9px] font-bold leading-none text-on-error">
          {count}
        </span>
      ) : null}
    </span>
  );
}

export function MenuIcon({ className = "" }: { className?: string }) {
  return (
    <PathIcon className={className}>
      <path d="M4 7 H20 M4 12 H20 M4 17 H20" />
    </PathIcon>
  );
}

export function CloseIcon({ className = "" }: { className?: string }) {
  return (
    <PathIcon className={className}>
      <path d="M6 6 L18 18 M18 6 L6 18" />
    </PathIcon>
  );
}

export function ArrowIcon({
  className = "",
  size = 18,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <PathIcon size={size} className={className}>
      <path d="M5 12 H19 M13 6 L19 12 L13 18" />
    </PathIcon>
  );
}

export function ChevronDownIcon({ className = "" }: { className?: string }) {
  return (
    <PathIcon className={className}>
      <path d="M6 9 L12 15 L18 9" />
    </PathIcon>
  );
}

export function EyeIcon({
  className = "",
  off = false,
}: {
  className?: string;
  off?: boolean;
}) {
  return (
    <PathIcon className={className}>
      <path d="M2.5 12 C 5.5 6 9 4 12 4 C 15 4 18.5 6 21.5 12 C 18.5 18 15 20 12 20 C 9 20 5.5 18 2.5 12 Z" />
      <circle cx="12" cy="12" r="3" />
      {off ? <path d="M4 4 L20 20" /> : null}
    </PathIcon>
  );
}

export function VerifiedIcon({
  className = "",
  filled = false,
  size = 16,
}: {
  className?: string;
  filled?: boolean;
  size?: number;
}) {
  return (
    <PathIcon size={size} className={className}>
      <path
        d="M12 2.5 L17 5 L21 5 V11 C21 16.5 17 19.5 12 21.5 C7 19.5 3 16.5 3 11 V5 H7 Z"
        fill={filled ? "currentColor" : "none"}
      />
      <path d="M8.5 12 L11 14.5 L15.5 9.5" />
    </PathIcon>
  );
}

export function ShieldIcon({
  className = "",
  size = 18,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <PathIcon size={size} className={className}>
      <path d="M12 2.5 L17 5 V11 C17 16 13.8 19.2 12 20.5 C10.2 19.2 7 16 7 11 V5 Z" />
      <path d="M9 11.5 L11 13.5 L15 9.5" />
    </PathIcon>
  );
}

export function TruckIcon({
  className = "",
  size = 18,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <PathIcon size={size} className={className}>
      <path d="M2 6 H14 V17 H2 Z M14 9 H18 L21 12 V17 H14" />
      <circle cx="6" cy="17.5" r="1.8" />
      <circle cx="17.5" cy="17.5" r="1.8" />
    </PathIcon>
  );
}

export function PaymentsIcon({
  className = "",
  size = 18,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <PathIcon size={size} className={className}>
      <rect x="2.5" y="5" width="15" height="12" rx="1" />
      <path d="M19 9 H21 V17 A2 2 0 0 1 19 19 H6" />
      <path d="M2.5 9 H17.5" />
    </PathIcon>
  );
}

export function ReturnsIcon({
  className = "",
  size = 18,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <PathIcon size={size} className={className}>
      <path d="M4 12 A8 8 0 1 0 6.2 7" />
      <path d="M4 4 V8 H8" />
      <path d="M9.5 9.5 H15 V14 L13.5 12.5 A4 4 0 0 0 9 17" />
    </PathIcon>
  );
}

export function LocationIcon({
  className = "",
  size = 18,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <PathIcon size={size} className={className}>
      <path d="M12 21 C 12 21 5 14.5 5 10 a7 7 0 0 1 14 0 C 19 14.5 12 21 12 21 Z" />
      <circle cx="12" cy="10" r="2.5" />
    </PathIcon>
  );
}

export function PersonIcon({
  className = "",
  size = 18,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <PathIcon size={size} className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20 C 5.5 15.5 8.5 13.5 12 13.5 C 15.5 13.5 18.5 15.5 19.5 20" />
    </PathIcon>
  );
}

export function LockIcon({
  className = "",
  size = 18,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <PathIcon size={size} className={className}>
      <rect x="5" y="10.5" width="14" height="9" rx="1" />
      <path d="M8 10.5 V7.5 a4 4 0 0 1 8 0 V10.5" />
    </PathIcon>
  );
}

export function StoreIcon({
  className = "",
  size = 18,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <PathIcon size={size} className={className}>
      <path d="M4 9 L5.5 4 H18.5 L20 9" />
      <path d="M4 9 A3 3 0 0 0 10 9 A3 3 0 0 0 16 9 A3 3 0 0 0 22 9 H20.5 V20 H3.5 V9 Z" opacity="0" fill="none" />
      <path d="M4 9 a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 4-0" />
      <path d="M5.5 20 V14 H18.5 V20" />
    </PathIcon>
  );
}

export function StarIcon({
  className = "",
  size = 14,
  filled = false,
}: {
  className?: string;
  size?: number;
  filled?: boolean;
}) {
  return (
    <PathIcon size={size} className={className}>
      <path
        d="M12 3.5 L14.8 9.4 L21 10.1 L16.5 14.3 L17.7 20.5 L12 17.4 L6.3 20.5 L7.5 14.3 L3 10.1 L9.2 9.4 Z"
        fill={filled ? "currentColor" : "none"}
      />
    </PathIcon>
  );
}

export function BoltIcon({
  className = "",
  size = 20,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <PathIcon size={size} className={className}>
      <path d="M13 2 L4 14 H10.5 L8.5 22 L19 9.5 H12 Z" fill="currentColor" stroke="none" />
    </PathIcon>
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

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-display-hero text-headline-sm uppercase tracking-[0.28em] text-primary select-none ${className}`}
    >
      ABYSS
    </span>
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
      className={`press focus-kill inline-flex h-10 w-10 items-center justify-center border bg-surface-paper/90 backdrop-blur-sm transition-colors ${
        active
          ? "border-accent-crimson text-accent-crimson"
          : "border-border-rule text-primary hover:border-accent-crimson hover:text-accent-crimson"
      } ${className}`}
    >
      <HeartGlyph filled={active} size={16} />
    </button>
  );
}