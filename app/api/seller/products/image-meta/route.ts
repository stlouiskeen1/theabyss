import { NextResponse } from "next/server";
import { routeErrorResponse, sessionOwnerId, updateProductImageMeta } from "@/lib/vendors.server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const owner = await sessionOwnerId();
    const body = (await req.json().catch(() => null)) as {
      vendorId?: unknown;
      productId?: unknown;
      imageUrl?: unknown;
      blurhash?: unknown;
      width?: unknown;
      height?: unknown;
    } | null;

    const vendorId = typeof body?.vendorId === "string" ? body.vendorId : "";
    const productId = typeof body?.productId === "string" ? body.productId : "";
    const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl : "";
    const blurhash = typeof body?.blurhash === "string" ? body.blurhash : null;
    const width = typeof body?.width === "number" ? body.width : null;
    const height = typeof body?.height === "number" ? body.height : null;

    if (!vendorId || !productId || !imageUrl) {
      return NextResponse.json(
        { error: "vendorId, productId and imageUrl are required" },
        { status: 400 }
      );
    }

    await updateProductImageMeta(owner, vendorId, productId, imageUrl, blurhash, width, height);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return routeErrorResponse(e);
  }
}