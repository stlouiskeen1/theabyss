import type { Metadata } from "next";
import CartView from "@/app/cart/CartView";

export const metadata: Metadata = {
  title: "Bag — Abyss",
};

export default function CartPage() {
  return <CartView />;
}