import { notFound } from "next/navigation";
import SellerView from "./SellerView";
import { SELLERS, getSeller, getSellerProducts } from "@/lib/mock";

export function generateStaticParams() {
  return SELLERS.map((s) => ({ id: s.id }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const seller = getSeller(id);
  if (!seller) notFound();
  const products = getSellerProducts(seller.id);
  return <SellerView seller={seller} products={products} />;
}