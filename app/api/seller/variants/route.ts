import { NextResponse } from "next/server";
import {
  deleteVariant,
  routeErrorResponse,
  sessionOwnerId,
  setVariantStock,
  upsertVariant,
} from "@/lib/vendors.server";

export const dynamic = "force-dynamic";

type Body = {
  action?: unknown;
  productId?: unknown;
  variantId?: unknown;
  size?: unknown;
  color?: unknown;
  sku?: unknown;
  priceOverride?: unknown;
  stockQuantity?: unknown;
  stock?: unknown;
};

const numOrNull = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

const strOrNull = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v.trim() : null;

const clean = (e: unknown) =>
  (e instanceof Error ? e.message : String(e))
    .replace("vendor_variant_upsert: ", "")
    .replace("vendor_variant_delete: ", "")
    .replace("vendor_stock_set: ", "");

const statusOf = (msg: string) =>
  msg.includes("forbidden")
    ? 403
    : msg.includes("sku_taken") || msg.includes("has_orders") || msg.includes("last_variant")
      ? 409
      : 400;

export async function POST(req: Request) {
  try {
    const owner = await sessionOwnerId();
    const body = (await req.json().catch(() => null)) as Body | null;
    const action = body?.action;

    try {
      if (action === "setStock") {
        if (typeof body?.variantId !== "string" || !body.variantId) {
          return NextResponse.json({ error: "variantId is required" }, { status: 400 });
        }
        const stock = numOrNull(body?.stock);
        if (stock === null || !Number.isInteger(stock) || stock < 0) {
          return NextResponse.json({ error: "stock must be a whole number ≥ 0" }, { status: 400 });
        }
        const variant = await setVariantStock(owner, body.variantId, stock);
        return NextResponse.json({ variant });
      }

      if (action === "delete") {
        if (typeof body?.variantId !== "string" || !body.variantId) {
          return NextResponse.json({ error: "variantId is required" }, { status: 400 });
        }
        await deleteVariant(owner, body.variantId);
        return NextResponse.json({ ok: true });
      }

      if (action !== "upsert") {
        return NextResponse.json({ error: "unknown action" }, { status: 400 });
      }
      if (typeof body?.productId !== "string" || !body.productId) {
        return NextResponse.json({ error: "productId is required" }, { status: 400 });
      }
      const variant = await upsertVariant(owner, body.productId, {
        variantId: typeof body?.variantId === "string" ? body.variantId : null,
        size: strOrNull(body?.size),
        color: strOrNull(body?.color),
        sku: strOrNull(body?.sku),
        priceOverride: body?.priceOverride === null ? null : numOrNull(body?.priceOverride),
        stockQuantity:
          body?.stockQuantity === null || body?.stockQuantity === undefined
            ? null
            : numOrNull(body?.stockQuantity),
      });
      return NextResponse.json({ variant });
    } catch (e) {
      const msg = clean(e);
      return NextResponse.json({ error: msg }, { status: statusOf(msg) });
    }
  } catch (e) {
    return routeErrorResponse(e);
  }
}
