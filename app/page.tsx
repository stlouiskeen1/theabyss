import HomeView from "./HomeView";
import { listLiveProducts, toMockProduct } from "@/lib/catalog.server";
import type { LiveListRow } from "@/lib/catalog.server";

export default async function Home() {
  // Live products lead the homepage grid; mock fallback when offline/empty.
  let live: import("@/lib/mock").Product[] | undefined;
  try {
    const rows = (await listLiveProducts(null, null, 24).catch(
      () => null
    )) as unknown as LiveListRow[] | null;
    if (Array.isArray(rows) && rows.length > 0) {
      live = rows.map(toMockProduct);
    }
  } catch {
    live = undefined;
  }
  return <HomeView liveProducts={live} />;
}
