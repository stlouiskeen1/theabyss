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
