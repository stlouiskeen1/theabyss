import type { Metadata } from "next";
import CheckoutView from "@/app/checkout/CheckoutView";

export const metadata: Metadata = {
  title: "Checkout — Abyss",
};

export default function CheckoutPage() {
  return <CheckoutView />;
}