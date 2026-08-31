import { notFound } from "next/navigation";
import ProductDetailView from "./ProductDetailView";
import { getAllProductIds, getProduct } from "@/lib/mock";

export function generateStaticParams() {
  return getAllProductIds().map((id) => ({ id }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) notFound();
  return <ProductDetailView product={product} />;
}