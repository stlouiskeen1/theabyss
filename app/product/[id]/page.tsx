import { notFound } from "next/navigation";
import ProductDetailView from "./ProductDetailView";
import { getAllProductIds, getProduct } from "@/lib/mock";
import { getLiveProduct, toMockProductDetail } from "@/lib/catalog.server";
import type { LiveDetail } from "@/lib/catalog.server";

export function generateStaticParams() {
  return getAllProductIds().map((id) => ({ id }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Live catalog first (`live:slug` ids or plain live slugs); mock fallback.
  const slug = id.startsWith("live:") ? id.slice("live:".length) : id;
  const detail = (await getLiveProduct(slug).catch(() => null)) as LiveDetail | null;
  if (detail?.product) {
    const mapped = toMockProductDetail(detail);
    return <ProductDetailView product={mapped.product} live={{ variants: mapped.variants }} />;
  }

  const product = getProduct(id);
  if (!product) notFound();
  return <ProductDetailView product={product} />;
}
