import type { Metadata } from "next";
import AuthForm from "@/app/account/AuthForm";

export const metadata: Metadata = {
  title: "Create Account — Abyss",
};

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}