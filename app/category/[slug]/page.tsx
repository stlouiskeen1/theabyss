import { notFound } from "next/navigation";
import CategoryView from "./CategoryView";
import { listLiveProducts, toMockProduct } from "@/lib/catalog.server";
import type { LiveListRow } from "@/lib/catalog.server";

const SLUGS = ["all", "apparel", "footwear", "accessories", "outerwear"];

export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }));
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ g?: string; sub?: string }>;
}) {
  const { slug } = await params;
  if (!SLUGS.includes(slug)) notFound();
  const sp = await searchParams;

  // Live catalog first (filtered by category); mock fallback when the
  // backend is unreachable or has no live products for this shelf.
  let live: import("@/lib/mock").Product[] | undefined;
  try {
    const rows = (await listLiveProducts(
      slug === "all" ? null : slug,
      null,
      60
    ).catch(() => null)) as unknown as LiveListRow[] | null;
    if (Array.isArray(rows) && rows.length > 0) {
      live = rows.map(toMockProduct);
    }
  } catch {
    live = undefined;
  }

  return <CategoryView slug={slug} g={sp.g} sub={sp.sub} products={live} />;
}
