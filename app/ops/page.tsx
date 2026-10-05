import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OpsView from "@/app/ops/OpsView";

export const metadata: Metadata = {
  title: "Operations Desk — Abyss",
};

export const dynamic = "force-dynamic";

export default async function OpsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/account/login");
  return <OpsView />;
}