import { NextResponse } from "next/server";
import { getVendorAnalytics, routeErrorResponse, sessionOwnerId } from "@/lib/vendors.server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const owner = await sessionOwnerId();
    const params = new URL(req.url).searchParams;
    const vendorId = params.get("vendorId");
    const days = Math.max(1, Math.min(365, Number(params.get("days") ?? 30) || 30));
    if (!vendorId) return NextResponse.json({ error: "vendorId is required" }, { status: 400 });
    const analytics = await getVendorAnalytics(owner, vendorId, days);
    return NextResponse.json({ analytics });
  } catch (e) {
    return routeErrorResponse(e);
  }
}
