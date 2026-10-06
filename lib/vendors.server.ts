import { NextResponse } from "next/server";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";

/*
 * Server-side vendor access (service role).
 *
 * Imported ONLY by route handlers / server components. Mirrors
 * lib/orders.server.ts: the browser has no direct table access (0009), so
 * every seller read/write goes through SECURITY DEFINER RPCs (0012) with the
 * session user id passed explicitly after the route verifies the session.
 */

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let cached: SupabaseClient<Database> | null | undefined;

function admin(): SupabaseClient<Database> | null {
  if (cached !== undefined) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || !SERVICE_ROLE_KEY) {
    cached = null;
    return cached;
  }
  cached = createClient<Database>(url, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
  return cached;
}

async function call<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const supabase = admin();
  if (!supabase) throw new Error("Supabase service role is not configured");
  const { data, error } = await supabase.rpc(name as never, (args ?? {}) as never);
  if (error) throw new Error(error.message);
  return data as unknown as T;
}

export type VendorApplyInput = {
  name: string;
  slug: string;
  description?: string | null;
  wilayaId?: number | null;
  communeId?: number | null;
};

export function applyVendor(owner: string, input: VendorApplyInput) {
  return call<Json>("vendor_apply", {
    p_owner: owner,
    p_name: input.name,
    p_slug: input.slug,
    p_description: input.description ?? null,
    p_wilaya_id: input.wilayaId ?? null,
    p_commune_id: input.communeId ?? null,
  });
}

export function listOwnVendors(owner: string) {
  return call<Json[]>("vendor_list_own", { p_owner: owner });
}

export function listVendorOrders(owner: string, vendorId: string) {
  return call<Json[]>("vendor_orders_list", { p_owner: owner, p_vendor_id: vendorId });
}

export function listVendorPayouts(owner: string, vendorId: string) {
  return call<Json[]>("vendor_payouts_list", { p_owner: owner, p_vendor_id: vendorId });
}

export function getPublicVendor(slug: string) {
  return call<Json | null>("vendor_public_get", { p_slug: slug });
}

export type ProductUpsertInput = {
  productId?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  brand?: string | null;
  basePrice: number;
  status?: string | null;
  imageUrl?: string | null;
  categoryId?: string | null;
};

export function listCategories() {
  return call<Json[]>("catalog_categories", {});
}

export function listVendorProducts(owner: string, vendorId: string) {
  return call<Json[]>("vendor_products_list", { p_owner: owner, p_vendor_id: vendorId });
}

export function upsertProduct(owner: string, vendorId: string, input: ProductUpsertInput) {
  return call<Json>("vendor_product_upsert", {
    p_owner: owner,
    p_vendor_id: vendorId,
    p_product_id: input.productId ?? null,
    p_name: input.name,
    p_slug: input.slug,
    p_description: input.description ?? null,
    p_brand: input.brand ?? null,
    p_base_price: input.basePrice,
    p_status: input.status ?? null,
    p_image_url: input.imageUrl ?? null,
    p_category_id: input.categoryId ?? null,
  });
}

export function archiveProduct(owner: string, productId: string) {
  return call<Json>("vendor_product_archive", { p_owner: owner, p_product_id: productId });
}

export function deleteProduct(owner: string, productId: string) {
  return call<boolean>("vendor_product_delete", { p_owner: owner, p_product_id: productId });
}

export type VariantUpsertInput = {
  variantId?: string | null;
  size?: string | null;
  color?: string | null;
  sku?: string | null;
  priceOverride?: number | null;
  stockQuantity?: number | null;
};

export function upsertVariant(owner: string, productId: string, input: VariantUpsertInput) {
  return call<Json>("vendor_variant_upsert", {
    p_owner: owner,
    p_product_id: productId,
    p_variant_id: input.variantId ?? null,
    p_size: input.size ?? null,
    p_color: input.color ?? null,
    p_sku: input.sku ?? null,
    p_price_override: input.priceOverride ?? null,
    p_stock_quantity: input.stockQuantity ?? null,
  });
}

export function deleteVariant(owner: string, variantId: string) {
  return call<boolean>("vendor_variant_delete", { p_owner: owner, p_variant_id: variantId });
}

export function setVariantStock(owner: string, variantId: string, stock: number) {
  return call<Json>("vendor_stock_set", {
    p_owner: owner,
    p_variant_id: variantId,
    p_stock: stock,
  });
}

export function getVendorAnalytics(owner: string, vendorId: string, days = 30) {
  return call<Json>("vendor_analytics", {
    p_owner: owner,
    p_vendor_id: vendorId,
    p_days: days,
  });
}

/**
 * Session owner id for seller API routes. Throws "unauthorized" when there is
 * no signed-in user, and a descriptive Error otherwise — routes catch these
 * and always answer JSON (never an HTML 500 page the client can't parse).
 */
export async function sessionOwnerId(): Promise<string> {
  let supabase;
  try {
    supabase = await createSessionClient();
  } catch {
    throw new Error("Supabase is not configured (missing URL / anon key)");
  }
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  if (!user) throw new Error("unauthorized");
  return user.id;
}

/** Map a caught route error to a JSON response (401 for auth, else 400/500). */
export function routeErrorResponse(e: unknown, prefix = "") {
  const raw = e instanceof Error ? e.message : String(e);
  const msg = prefix && raw.startsWith(prefix) ? raw.slice(prefix.length) : raw;
  const status = msg === "unauthorized" ? 401 : msg === "forbidden" ? 403 : 500;
  return NextResponse.json({ error: msg }, { status });
}
