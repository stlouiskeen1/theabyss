import type { Metadata } from "next";
import OpsView from "@/app/ops/OpsView";

export const metadata: Metadata = {
  title: "Operations Desk — Abyss",
};

export default function OpsPage() {
  return <OpsView />;
}