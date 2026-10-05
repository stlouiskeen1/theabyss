import { NextResponse } from "next/server";
import {
  archiveProduct,
  deleteProduct,
  listVendorProducts,
  routeErrorResponse,
  sessionOwnerId,
  upsertProduct,
} from "@/lib/vendors.server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const owner = await sessionOwnerId();
    const vendorId = new URL(req.url).searchParams.get("vendorId");
    if (!vendorId) return NextResponse.json({ error: "vendorId is required" }, { status: 400 });
    const products = await listVendorProducts(owner, vendorId);
    return NextResponse.json({ products });
  } catch (e) {
    return routeErrorResponse(e);
  }
}

type Body = {
  action?: unknown;
  vendorId?: unknown;
  productId?: unknown;
  name?: unknown;
  slug?: unknown;
  description?: unknown;
  brand?: unknown;
  basePrice?: unknown;
  status?: unknown;
  imageUrl?: unknown;
};

export async function POST(req: Request) {
  try {
    const owner = await sessionOwnerId();
    const body = (await req.json().catch(() => null)) as Body | null;
    const action = body?.action;

    if (action === "archive" || action === "delete") {
      if (typeof body?.productId !== "string" || !body.productId) {
        return NextResponse.json({ error: "productId is required" }, { status: 400 });
      }
      try {
        if (action === "archive") {
          return NextResponse.json({ product: await archiveProduct(owner, body.productId) });
        }
        await deleteProduct(owner, body.productId);
        return NextResponse.json({ ok: true });
      } catch (e) {
        const msg = (e as Error).message
          .replace("vendor_product_archive: ", "")
          .replace("vendor_product_delete: ", "");
        const status = msg.includes("forbidden") ? 403 : msg.includes("has_orders") ? 409 : 400;
        return NextResponse.json({ error: msg }, { status });
      }
    }

    if (action !== "create" && action !== "update") {
      return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
    const vendorId = typeof body?.vendorId === "string" ? body.vendorId : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const slug = typeof body?.slug === "string" ? body.slug.trim().toLowerCase() : "";
    const price = typeof body?.basePrice === "number" ? body.basePrice : Number.NaN;
    if (!vendorId || !name || !slug || !Number.isFinite(price)) {
      return NextResponse.json(
        { error: "vendorId, name, slug and basePrice are required" },
        { status: 400 }
      );
    }
    try {
      const product = await upsertProduct(owner, vendorId, {
        productId:
          action === "update" && typeof body?.productId === "string" ? body.productId : null,
        name,
        slug,
        description: typeof body?.description === "string" ? body.description.trim() || null : null,
        brand: typeof body?.brand === "string" ? body.brand.trim() || null : null,
        basePrice: price,
        status: typeof body?.status === "string" ? body.status : null,
        imageUrl: typeof body?.imageUrl === "string" ? body.imageUrl.trim() || null : null,
      });
      return NextResponse.json({ product });
    } catch (e) {
      const msg = (e as Error).message.replace("vendor_product_upsert: ", "");
      const status = msg.includes("forbidden") ? 403 : msg.includes("slug_taken") ? 409 : 400;
      return NextResponse.json({ error: msg }, { status });
    }
  } catch (e) {
    return routeErrorResponse(e);
  }
}
