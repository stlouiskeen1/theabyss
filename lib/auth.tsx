"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type User = {
  id: string;
  name: string;
  email: string;
};

type AuthContextValue = {
  user: User | null;
  signUp: (name: string, email: string, password: string) => { ok: true } | { ok: false; error: string };
  signIn: (email: string, password: string) => { ok: true } | { ok: false; error: string };
  signInWithGoogle: () => { ok: true } | { ok: false; error: string };
  signOut: () => void;
};

const USERS_KEY = "abyss-users";
const SESSION_KEY = "abyss-session";

const AuthContext = createContext<AuthContextValue | null>(null);

/*
 * Demo auth. Everything lives in localStorage so the app is fully functional
 * offline and the API shape (`signUp` / `signIn` / `signOut` / `user`) matches
 * what a Supabase-backed implementation would look like — swapping the bodies
 * later needs no changes in the pages.
 *
 * IMPORTANT: this is NOT real auth. Passwords are stored in plaintext and
 * there is no server, hashing, session tokens or recovery. Do not ship it.
 */

// --- Store helpers ---------------------------------------------------------
type StoredUser = User & { password: string };

function readUsers(): Record<string, StoredUser> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "{}") as Record<
      string,
      StoredUser
    >;
  } catch {
    return {};
  }
}

function writeUsers(users: Record<string, StoredUser>) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    /* storage unavailable */
  }
}

let session: User | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const cb of listeners) cb();
}

/** Loads the persisted session into memory and notifies subscribers. */
function hydrateSession() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    session = raw ? (JSON.parse(raw) as User) : null;
  } catch {
    session = null;
  }
  emit();
}

function commitSession(next: User | null) {
  session = next;
  try {
    if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage unavailable */
  }
  emit();
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
const getSnapshot = () => session;
const getServerSnapshot = () => null;

// --- Validation (shared by login/signup, mirroring a real flow) ------------
export type AuthError = string;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  if (!email) return "auth.errEmailRequired";
  if (!EMAIL_RE.test(email)) return "auth.errEmailInvalid";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "auth.errPasswordRequired";
  if (password.length < 8) return "auth.errPasswordMin";
  return null;
}

export function validateSignupName(name: string): string | null {
  if (!name.trim()) return "auth.errNameRequired";
  if (name.trim().length < 2) return "auth.errNameShort";
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Restore the persisted session right after mount (SSR renders logged-out,
  // avoiding a hydration mismatch on the nav, mirroring the cart store).
  useEffect(() => {
    hydrateSession();
    const onStorage = (e: StorageEvent) => {
      if (e.key === SESSION_KEY) hydrateSession();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const signUp = useCallback(
    (name: string, email: string, password: string) => {
      const emailKey = email.trim().toLowerCase();
      const users = readUsers();
      if (users[emailKey]) {
        return { ok: false as const, error: "auth.errEmailTaken" as const };
      }
      const newUser: StoredUser = {
        id: `u-${Date.now().toString(36)}${Math.random()
          .toString(36)
          .slice(2, 7)}`,
        name: name.trim(),
        email: email.trim(),
        password,
      };
      users[emailKey] = newUser;
      writeUsers(users);
      commitSession({ id: newUser.id, name: newUser.name, email: newUser.email });
      return { ok: true as const };
    },
    []
  );

  const signIn = useCallback((email: string, password: string) => {
    const emailKey = email.trim().toLowerCase();
    const user = readUsers()[emailKey];
    if (!user || user.password !== password) {
      return { ok: false as const, error: "auth.errInvalidCredentials" as const };
    }
    commitSession({ id: user.id, name: user.name, email: user.email });
    return { ok: true as const };
  }, []);

  /**
   * Demo "Continue with Google". There is no real provider, so it signs the
   * visitor in as a fixed placeholder Google account. A real implementation
   * would replace this with `supabase.auth.signInWithOAuth({ provider:
   * 'google' })` and resume the session in a callback — no page changes.
   */
  const signInWithGoogle = useCallback(() => {
    const googleUser: StoredUser = {
      id: `g-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
      name: "Google User",
      email: "demo@gmail.com",
      password: "",
    };
    commitSession({ id: googleUser.id, name: googleUser.name, email: googleUser.email });
    return { ok: true as const };
  }, []);

  const signOut = useCallback(() => commitSession(null), []);

  const value = useMemo(
    () => ({ user, signUp, signIn, signInWithGoogle, signOut }),
    [user, signUp, signIn, signInWithGoogle, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}