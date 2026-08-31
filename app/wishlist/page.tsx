import type { Metadata } from "next";
import WishlistView from "@/app/wishlist/WishlistView";

export const metadata: Metadata = {
  title: "Wishlist — Abyss",
};

export default function WishlistPage() {
  return <WishlistView />;
}
