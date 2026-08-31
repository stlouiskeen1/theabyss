import type { Metadata } from "next";
import AccountView from "@/app/account/AccountView";

export const metadata: Metadata = {
  title: "Account — Abyss",
};

export default function AccountPage() {
  return <AccountView />;
}