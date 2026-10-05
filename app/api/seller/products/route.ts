import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  archiveProduct,
  deleteProduct,
  listVendorProducts,
  upsertProduct,
} from "@/lib/vendors.server";

export const dynamic = "force-dynamic";

async function sessionUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function GET(req: Request) {
  const owner = await sessionUserId();
  if (!owner) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const vendorId = new URL(req.url).searchParams.get("vendorId");
  if (!vendorId) return NextResponse.json({ error: "vendorId is required" }, { status: 400 });
  try {
    const products = await listVendorProducts(owner, vendorId);
    return NextResponse.json({ products });
  } catch (e) {
    const msg = (e as Error).message;
    return NextResponse.json(
      { error: msg },
      { status: msg.includes("forbidden") ? 403 : 500 }
    );
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

const err = (e: unknown) => {
  const msg = (e as Error).message;
  const clean = msg.replace("vendor_product_upsert: ", "").replace("vendor_product_archive: ", "").replace("vendor_product_delete: ", "");
  const status = msg.includes("forbidden")
    ? 403
    : msg.includes("slug_taken")
      ? 409
      : msg.includes("has_orders")
        ? 409
        : 400;
  return NextResponse.json({ error: clean }, { status });
};

export async function POST(req: Request) {
  const owner = await sessionUserId();
  if (!owner) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as Body | null;
  const action = body?.action;

  try {
    if (action === "archive" || action === "delete") {
      if (typeof body?.productId !== "string" || !body.productId) {
        return NextResponse.json({ error: "productId is required" }, { status: 400 });
      }
      if (action === "archive") {
        return NextResponse.json({ product: await archiveProduct(owner, body.productId) });
      }
      await deleteProduct(owner, body.productId);
      return NextResponse.json({ ok: true });
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
    return err(e);
  }
}
