"use client";

import { Auth0Provider, useUser } from "@auth0/nextjs-auth0/client";
import { createContext, useContext, type ReactNode } from "react";

export type User = {
  id: string;
  name: string;
  email: string;
};

export type AuthResult = { ok: true } | { ok: false; error: string };

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signUp: () => AuthResult;
  signIn: () => AuthResult;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const LOGIN_PATH = "/auth/login";

// The SDK's middleware (`/auth/login`, `/auth/logout`) handles the OAuth
// redirect, so signing in/up is a full-page navigation to Auth0's hosted
// Universal Login page rather than an in-app form submit.
function redirect(path: string): AuthResult {
  try {
    window.location.assign(path);
    return { ok: true };
  } catch {
    return { ok: false, error: "auth.errUnexpected" };
  }
}

function AuthBridge({ children }: { children: ReactNode }) {
  const { user: auth0User, isLoading } = useUser();

  const user: User | null =
    auth0User && !isLoading
      ? {
          id: auth0User.sub ?? "",
          name:
            auth0User.name?.trim() ||
            auth0User.nickname?.trim() ||
            auth0User.email ||
            "",
          email: auth0User.email ?? "",
        }
      : null;

  const value: AuthContextValue = {
    user,
    loading: isLoading,
    signIn: () => redirect(LOGIN_PATH),
    signUp: () => redirect(`${LOGIN_PATH}?screen_hint=signup`),
    signOut: () => redirect("/auth/logout"),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <Auth0Provider>
      <AuthBridge>{children}</AuthBridge>
    </Auth0Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}