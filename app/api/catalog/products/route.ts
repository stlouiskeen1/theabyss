import { NextResponse } from "next/server";
import { listLiveProducts } from "@/lib/catalog.server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const params = new URL(req.url).searchParams;
    const limit = Math.max(1, Math.min(120, Number(params.get("limit") ?? 60) || 60));
    const offset = Math.max(0, Number(params.get("offset") ?? 0) || 0);
    // Fetch one extra row as a has-more probe (cursor-style pagination).
    const rows = await listLiveProducts(
      params.get("category"),
      params.get("search"),
      limit + 1,
      offset
    );
    const hasMore = rows.length > limit;
    const products = hasMore ? rows.slice(0, limit) : rows;
    return NextResponse.json({
      products,
      hasMore,
      nextOffset: hasMore ? offset + limit : null,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
