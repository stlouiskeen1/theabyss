import { NextResponse } from "next/server";
import { listOwnVendors, routeErrorResponse, sessionOwnerId } from "@/lib/vendors.server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const owner = await sessionOwnerId();
    const vendors = await listOwnVendors(owner);
    return NextResponse.json({ vendors });
  } catch (e) {
    return routeErrorResponse(e);
  }
}
