import type { Metadata } from "next";
import DashboardView from "./DashboardView";

export const metadata: Metadata = {
  title: "Seller Desk — Abyss",
};

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return <DashboardView />;
}
