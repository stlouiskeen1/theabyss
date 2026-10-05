"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabaseClient } from "@/lib/supabase";

export type User = {
  id: string;
  name: string;
  email: string;
};

export type AuthResult = { ok: true } | { ok: false; error: string };

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (name: string, email: string, password: string) => Promise<AuthResult>;
  signInGoogle: () => Promise<AuthResult>;
  signUpGoogle: () => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toUser(u: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null): User | null {
  if (!u) return null;
  const meta = u.user_metadata ?? {};
  const name =
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim()) ||
    u.email ||
    "";
  return { id: u.id, name, email: u.email ?? "" };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = supabaseClient();
    if (!supabase) {
      queueMicrotask(() => setLoading(false));
      return;
    }
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(toUser(data.user));
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(toUser(session?.user ?? null));
      setLoading(false);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const fail = (error: string): AuthResult => ({ ok: false, error });

  const value: AuthContextValue = {
    user,
    loading,
    signIn: async (email, password) => {
      const supabase = supabaseClient();
      if (!supabase) return fail("auth.errUnexpected");
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return fail(error.message === "Invalid login credentials" ? "auth.errInvalidCredentials" : error.message);
      return { ok: true };
    },
    signUp: async (name, email, password) => {
      const supabase = supabaseClient();
      if (!supabase) return fail("auth.errUnexpected");
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error) {
        return fail(error.message.includes("already registered") ? "auth.errEmailTaken" : error.message);
      }
      return { ok: true };
    },
    signInGoogle: () => google(),
    signUpGoogle: () => google(),
    resetPassword: async (email) => {
      const supabase = supabaseClient();
      if (!supabase) return fail("auth.errUnexpected");
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      return error ? fail(error.message) : { ok: true };
    },
    signOut: async () => {
      const supabase = supabaseClient();
      if (supabase) await supabase.auth.signOut();
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

async function google(): Promise<AuthResult> {
  const supabase = supabaseClient();
  if (!supabase) return { ok: false, error: "auth.errUnexpected" };
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
  if (!error) return { ok: true };
  const msg = error.message.toLowerCase();
  if (msg.includes("provider is not enabled") || msg.includes("unsupported provider")) {
    return { ok: false, error: "auth.errGoogleDisabled" };
  }
  return { ok: false, error: error.message };
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
