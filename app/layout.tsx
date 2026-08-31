import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Anton, Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";
import { AuthProvider } from "@/lib/auth";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";

const anton = Anton({
  variable: "--font-abyss-display",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const inter = Inter({
  variable: "--font-abyss-ui",
  subsets: ["latin"],
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
      className={`${anton.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-canvas font-sans text-ink">
        <LanguageProvider>
          <CartProvider>
            <WishlistProvider>
              <AuthProvider>
                <Nav />
                <main className="flex flex-1 flex-col">{children}</main>
                <Footer />
                <CartDrawer />
              </AuthProvider>
            </WishlistProvider>
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}