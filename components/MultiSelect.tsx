"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

export type MultiSelectOption = {
  id: string;
  label: string;
  swatch?: string;
  group?: string;
};

type MultiSelectProps = {
  options: MultiSelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  loading?: boolean;
  emptyLabel?: string;
  ariaLabel?: string;
  className?: string;
};

const MAX_VISIBLE_CHIPS = 3;

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder,
  searchable = false,
  searchPlaceholder,
  loading = false,
  emptyLabel = "No options",
  ariaLabel,
  className = "",
}: MultiSelectProps) {
  const id = useId();
  const listId = `${id}-listbox`;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const optionRefs = useRef<Array<HTMLDivElement | null>>([]);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const selected = useMemo(
    () => options.filter((option) => value.includes(option.id)),
    [options, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => option.label.toLowerCase().includes(q));
  }, [options, query]);

  const openList = () => {
    setQuery("");
    setActiveIndex(0);
    setOpen(true);
  };

  const closeList = (focusTrigger = false) => {
    setOpen(false);
    setQuery("");
    if (focusTrigger) triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open && searchable) searchRef.current?.focus();
  }, [open, searchable]);

  useEffect(() => {
    if (!open) return;
    optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const toggle = (optionId: string) => {
    onChange(
      value.includes(optionId)
        ? value.filter((entry) => entry !== optionId)
        : [...value, optionId],
    );
  };

  const onKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        closeList(true);
      }
      return;
    }

    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ")) {
      if (event.target === triggerRef.current || event.target === event.currentTarget) {
        event.preventDefault();
        openList();
      }
      return;
    }

    if (!open) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, Math.max(filtered.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(Math.max(filtered.length - 1, 0));
    } else if (event.key === " " || event.key === "Enter") {
      if (event.target instanceof HTMLInputElement) return;
      event.preventDefault();
      const option = filtered[activeIndex];
      if (option) toggle(option.id);
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  };

  const visible = selected.slice(0, MAX_VISIBLE_CHIPS);
  const hiddenCount = selected.length - visible.length;

  return (
    <div ref={rootRef} onKeyDown={onKeyDown} className={`relative ${className}`}>
      <div
        ref={triggerRef}
        role="combobox"
        tabIndex={0}
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-haspopup="listbox"
        aria-label={ariaLabel ?? placeholder}
        aria-activedescendant={open && filtered[activeIndex] ? `${listId}-option-${activeIndex}` : undefined}
        onClick={() => (open ? closeList() : openList())}
        className={`flex min-h-11 w-full cursor-pointer flex-wrap items-center gap-unit-2xs rounded bg-surface-container-low px-unit-md py-1.5 text-left font-mono-technical text-mono-technical text-primary focus:outline-none focus:ring-1 focus:ring-primary ${
          open ? "ring-1 ring-primary" : ""
        }`}
      >
        {selected.length === 0 ? (
          <span className="text-text-muted/60">{loading ? "Loading…" : placeholder}</span>
        ) : (
          <>
            {visible.map((option) => (
              <span
                key={option.id}
                className="inline-flex max-w-full items-center gap-1 rounded border border-border-rule bg-surface-paper px-1.5 py-0.5 text-[11px] uppercase tracking-wide"
              >
                {option.swatch ? (
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0 rounded-full border border-border-rule"
                    style={{ background: option.swatch }}
                  />
                ) : null}
                <span className="truncate">{option.label}</span>
                <button
                  type="button"
                  aria-label={`Remove ${option.label}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    toggle(option.id);
                  }}
                  className="ml-0.5 text-text-muted transition-colors hover:text-accent-crimson"
                >
                  ×
                </button>
              </span>
            ))}
            {hiddenCount > 0 ? (
              <span className="text-[11px] uppercase tracking-wide text-text-muted">+{hiddenCount} more</span>
            ) : null}
          </>
        )}
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className={`ml-auto h-4 w-4 shrink-0 text-text-muted transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {open ? (
        <div className="absolute left-0 right-0 z-40 mt-unit-2xs overflow-hidden rounded border border-border-rule bg-surface-paper shadow-lg">
          {searchable ? (
            <div className="border-b border-border-rule p-unit-2xs">
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                placeholder={searchPlaceholder ?? "Search…"}
                aria-label={searchPlaceholder ?? "Search options"}
                className="h-9 w-full rounded bg-surface-container-low px-unit-sm font-mono-technical text-mono-technical text-primary placeholder:text-text-muted/60 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          ) : null}

          <div id={listId} role="listbox" aria-multiselectable aria-label={ariaLabel ?? placeholder} className="max-h-72 overflow-auto py-1">
            {loading ? (
              <p className="px-unit-sm py-unit-xs font-mono-technical text-[11px] text-text-muted">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="px-unit-sm py-unit-xs font-mono-technical text-[11px] text-text-muted">{emptyLabel}</p>
            ) : (
              filtered.map((option, index) => {
                const isSelected = value.includes(option.id);
                const isActive = index === activeIndex;
                const showGroup = Boolean(option.group) && option.group !== filtered[index - 1]?.group;
                return (
                  <div key={option.id}>
                    {showGroup ? (
                      <p className="px-unit-sm pb-1 pt-unit-xs font-label-caps-sm text-label-caps-sm uppercase tracking-widest text-text-muted">
                        {option.group}
                      </p>
                    ) : null}
                    <div
                      ref={(element) => {
                        optionRefs.current[index] = element;
                      }}
                      id={`${listId}-option-${index}`}
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => toggle(option.id)}
                      className={`flex cursor-pointer items-center gap-unit-2xs px-unit-sm py-unit-2xs font-mono-technical text-[11px] uppercase transition-colors ${
                        isActive ? "bg-surface-container-low" : ""
                      } ${isSelected ? "text-primary" : "text-on-surface-variant"}`}
                    >
                      <span
                        aria-hidden
                        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border ${
                          isSelected ? "border-primary bg-primary" : "border-border-rule"
                        }`}
                      >
                        {isSelected ? (
                          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-on-primary">
                            <path d="M2.5 6l2.2 2.2L9.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : null}
                      </span>
                      {option.swatch ? (
                        <span
                          aria-hidden
                          className="h-3 w-3 shrink-0 rounded-full border border-border-rule"
                          style={{ background: option.swatch }}
                        />
                      ) : null}
                      <span className="truncate">{option.label}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {selected.length > 0 ? (
            <div className="flex items-center justify-between border-t border-border-rule px-unit-sm py-unit-2xs">
              <span className="font-mono-technical text-[11px] text-text-muted">
                {selected.length} selected
              </span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="font-label-caps-sm text-label-caps-sm uppercase tracking-widest text-text-muted transition-colors hover:text-accent-crimson"
              >
                Clear all
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
