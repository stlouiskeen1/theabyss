import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import OpsView from "@/app/ops/OpsView";

export const metadata: Metadata = {
  title: "Operations Desk — Abyss",
};

export const dynamic = "force-dynamic";

export default async function OpsPage() {
  const session = await auth0.getSession();
  if (!session) redirect("/account/login");
  return <OpsView />;
}