import { NextResponse } from "next/server";
import { listCategories, routeErrorResponse, sessionOwnerId } from "@/lib/vendors.server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await sessionOwnerId();
    const categories = await listCategories();
    return NextResponse.json({ categories });
  } catch (e) {
    return routeErrorResponse(e);
  }
}
