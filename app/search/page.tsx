import SearchView from "./SearchView";
import { listLiveProducts, toMockProduct } from "@/lib/catalog.server";
import type { LiveListRow } from "@/lib/catalog.server";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();

  // Live matches first; mock fallback when offline/empty.
  let live: import("@/lib/mock").Product[] | undefined;
  if (query) {
    try {
      const rows = (await listLiveProducts(null, query, 24).catch(
        () => null
      )) as unknown as LiveListRow[] | null;
      if (Array.isArray(rows) && rows.length > 0) {
        live = rows.map(toMockProduct);
      }
    } catch {
      live = undefined;
    }
  }
  return <SearchView query={query} live={live} />;
}
