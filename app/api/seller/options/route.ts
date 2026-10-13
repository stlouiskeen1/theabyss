import { NextResponse } from "next/server";
import { listCatalogOptions, routeErrorResponse, sessionOwnerId } from "@/lib/vendors.server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await sessionOwnerId();
    const options = await listCatalogOptions();
    return NextResponse.json(options);
  } catch (e) {
    return routeErrorResponse(e);
  }
}
