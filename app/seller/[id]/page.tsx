import { notFound } from "next/navigation";
import SellerView from "./SellerView";
import { SELLERS, getSeller, getSellerProducts, placeholder } from "@/lib/mock";
import type { Product, Seller } from "@/lib/mock";
import { getPublicVendor } from "@/lib/vendors.server";

export function generateStaticParams() {
  return SELLERS.map((s) => ({ id: s.id }));
}

type LiveProduct = {
  id: string;
  name: string;
  slug: string;
  base_price: number | string;
  brand?: string | null;
  description?: string | null;
  image_url?: string | null;
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Live storefront first (active vendors by slug); mock catalogue fallback.
  const live = await getPublicVendor(id).catch(() => null);
  const livePayload = live as {
    vendor: {
      slug: string;
      name: string;
      description?: string | null;
      created_at: string;
    };
    products: LiveProduct[];
  } | null;
  if (livePayload?.vendor) {
    const v = livePayload.vendor;
    const seller: Seller = {
      id: v.slug,
      name: v.name,
      handle: v.slug,
      location: "Algeria",
      founded: new Date(v.created_at).getFullYear().toString(),
      about: v.description ?? v.name,
      aboutFr: v.description ?? v.name,
    };
    const products: Product[] = (livePayload.products ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description ?? p.name,
      descriptionFr: p.description ?? p.name,
      price: Number(p.base_price ?? 0),
      sellerId: v.slug,
      sellerName: v.name,
      category: "APPAREL",
      gender: "UNISEX",
      subcategory: "all",
      sizes: ["OS"],
      imageUrls: [p.image_url ?? placeholder(`product-${p.id}`, 800, 1000)],
      swatches: [],
      reviews: 0,
    }));
    return <SellerView seller={seller} products={products} />;
  }

  const seller = getSeller(id);
  if (!seller) notFound();
  const products = getSellerProducts(seller.id);
  return <SellerView seller={seller} products={products} />;
}