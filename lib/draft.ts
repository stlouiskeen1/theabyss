/*
 * Session draft helpers — typed form data survives a full page reload.
 *
 * Values live in sessionStorage (per-tab, cleared when the tab closes), so a
 * reload, crash, or tab-switch discard never eats what the user typed. Forms
 * clear their key on successful submit.
 */

export function loadDraft<T extends Record<string, unknown>>(key: string): Partial<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Partial<T>) : null;
  } catch {
    return null;
  }
}

export function saveDraft(key: string, value: Record<string, unknown>): void {
  try {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — form still works, just not persisted */
  }
}

export function clearDraft(key: string): void {
  try {
    if (typeof window !== "undefined") sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
