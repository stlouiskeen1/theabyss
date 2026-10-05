import { NextResponse } from "next/server";
import {
  listVendorOrders,
  listVendorPayouts,
  routeErrorResponse,
  sessionOwnerId,
} from "@/lib/vendors.server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const owner = await sessionOwnerId();
    const vendorId = new URL(req.url).searchParams.get("vendorId");
    if (!vendorId) {
      return NextResponse.json({ error: "vendorId is required" }, { status: 400 });
    }
    const [orders, payouts] = await Promise.all([
      listVendorOrders(owner, vendorId),
      listVendorPayouts(owner, vendorId),
    ]);
    return NextResponse.json({ orders, payouts });
  } catch (e) {
    return routeErrorResponse(e);
  }
}
