import { notFound } from "next/navigation";
import CategoryView from "./CategoryView";
import { listLiveProducts, toMockProduct } from "@/lib/catalog.server";
import type { LiveListRow } from "@/lib/catalog.server";
import type { Json } from "@/types/database.types";

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

  // Live catalog first; mock fallback when the backend is unreachable/empty.
  // Vendor-created products carry no category yet, so non-"all" pages stay on
  // mock until category assignment lands in the desk.
  let live: import("@/lib/mock").Product[] | undefined;
  if (slug === "all") {
    try {
      const rows = (await listLiveProducts(null, null, 60)) as unknown as LiveListRow[] | Json[];
      const list = rows as unknown as LiveListRow[];
      if (Array.isArray(list) && list.length > 0) {
        live = list.map(toMockProduct);
      }
    } catch {
      live = undefined;
    }
  }

  return <CategoryView slug={slug} g={sp.g} sub={sp.sub} products={live} />;
}
