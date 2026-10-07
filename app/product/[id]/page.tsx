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

  // Mock catalogue first (instant, sync). Live lookup second for slugs the
  // mock store doesn't know. Legacy `live:`-prefixed links keep working.
  const mock = getProduct(id);
  if (mock) return <ProductDetailView product={mock} />;

  const slug = id.startsWith("live:") ? id.slice("live:".length) : id;
  const detail = (await getLiveProduct(slug).catch(() => null)) as LiveDetail | null;
  if (detail?.product) {
    const mapped = toMockProductDetail(detail);
    return (
      <ProductDetailView
        product={mapped.product}
        live={{ variants: mapped.variants, vendorSlug: mapped.vendorSlug }}
      />
    );
  }
  notFound();
}
