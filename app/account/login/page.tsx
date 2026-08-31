import type { Metadata } from "next";
import AuthForm from "@/app/account/AuthForm";

export const metadata: Metadata = {
  title: "Sign In — Abyss",
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}