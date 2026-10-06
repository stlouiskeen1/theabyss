import { NextResponse } from "next/server";
import { listLiveProducts } from "@/lib/catalog.server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const params = new URL(req.url).searchParams;
    const products = await listLiveProducts(
      params.get("category"),
      params.get("search"),
      Math.max(1, Math.min(120, Number(params.get("limit") ?? 60) || 60))
    );
    return NextResponse.json({ products });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
