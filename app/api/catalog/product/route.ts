import { NextResponse } from "next/server";
import { getLiveProduct } from "@/lib/catalog.server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const slug = new URL(req.url).searchParams.get("slug");
    if (!slug) return NextResponse.json({ error: "slug is required" }, { status: 400 });
    const detail = await getLiveProduct(slug);
    if (!detail) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ detail });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
