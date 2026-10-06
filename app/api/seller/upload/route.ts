import { NextResponse } from "next/server";
import { routeErrorResponse, sessionOwnerId, uploadProductImage } from "@/lib/vendors.server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const owner = await sessionOwnerId();
    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    const vendorId = form?.get("vendorId");
    if (!(file instanceof Blob) || typeof vendorId !== "string" || !vendorId) {
      return NextResponse.json({ error: "file and vendorId are required" }, { status: 400 });
    }
    try {
      const url = await uploadProductImage(
        owner,
        vendorId,
        await file.arrayBuffer(),
        file.type,
        file.size
      );
      return NextResponse.json({ url });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const status = msg === "forbidden" ? 403 : 400;
      return NextResponse.json({ error: msg }, { status });
    }
  } catch (e) {
    return routeErrorResponse(e);
  }
}
