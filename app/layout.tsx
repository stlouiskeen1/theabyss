import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";
import { OrdersProvider } from "@/lib/orders";
import { AuthProvider } from "@/lib/auth";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ABYSS",
  description:
    "A marketplace connecting local sellers with buyers. Objects photographed, priced, shipped.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-surface-canvas font-body-utility text-body-utility text-on-surface">
        <LanguageProvider>
          <CartProvider>
            <WishlistProvider>
              <OrdersProvider>
                <AuthProvider>
                  <Nav />
                  <main className="flex flex-1 flex-col pt-16 sm:pt-24">{children}</main>
                  <Footer />
                  <CartDrawer />
                </AuthProvider>
              </OrdersProvider>
            </WishlistProvider>
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}