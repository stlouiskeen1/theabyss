import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";
import type { Category, Gender, Product } from "@/lib/mock";
import { placeholder } from "@/lib/mock";

/*
 * Server-side live catalog access (service role).
 *
 * Server components and public API routes only. Live rows are mapped into the
 * existing mock `Product` shape so every view (grid, PDP, cart, checkout)
 * renders unchanged; when the backend is unreachable callers fall back to the
 * mock catalogue.
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

export type LiveListRow = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  brand?: string | null;
  base_price: number | string;
  currency?: string | null;
  category_slug?: string | null;
  vendor_name: string;
  vendor_slug: string;
  image_url?: string | null;
  stock_total: number;
  created_at: string;
};

export type LiveVariant = {
  id: string;
  size?: string | null;
  color?: string | null;
  sku?: string | null;
  price_override?: number | string | null;
  stock_quantity: number;
};

export type LiveDetail = {
  product: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    brand?: string | null;
    base_price: number | string;
    currency?: string | null;
    category_slug?: string | null;
    vendor_name: string;
    vendor_slug: string;
    created_at: string;
  };
  variants: LiveVariant[];
  images: { id: string; url: string }[];
};

export function listLiveProducts(category?: string | null, search?: string | null, limit = 60) {
  return call<Json[]>("catalog_products", {
    p_category: category ?? null,
    p_search: search ?? null,
    p_limit: limit,
    p_offset: 0,
  });
}

export function getLiveProduct(slug: string) {
  return call<Json | null>("catalog_product", { p_slug: slug });
}

const CATEGORY_FALLBACK: Category = "APPAREL";

/** Map a live row into the mock Product shape the views already render. */
export function toMockProduct(row: LiveListRow): Product {
  return {
    id: `live:${row.slug}`,
    name: row.name,
    description: row.description ?? row.name,
    descriptionFr: row.description ?? row.name,
    price: Number(row.base_price ?? 0),
    sellerId: `live-vendor:${row.vendor_slug}`,
    sellerName: row.vendor_name,
    category: CATEGORY_FALLBACK,
    gender: "UNISEX" as Gender,
    subcategory: "all",
    sizes: ["OS"],
    imageUrls: [row.image_url ?? placeholder(`product-${row.slug}`, 800, 1000)],
    swatches: [],
    reviews: 0,
  };
}

/** Map a live detail payload (carries real variants for cart/checkout). */
export function toMockProductDetail(detail: LiveDetail): {
  product: Product;
  variants: LiveVariant[];
  images: string[];
  vendorSlug: string;
} {
  const p = detail.product;
  const images =
    detail.images.length > 0
      ? detail.images.map((i) => i.url)
      : [placeholder(`product-${p.slug}`, 800, 1000)];
  return {
    product: {
      id: `live:${p.slug}`,
      name: p.name,
      description: p.description ?? p.name,
      descriptionFr: p.description ?? p.name,
      price: Number(p.base_price ?? 0),
      sellerId: `live-vendor:${p.vendor_slug}`,
      sellerName: p.vendor_name,
      category: CATEGORY_FALLBACK,
      gender: "UNISEX" as Gender,
      subcategory: "all",
      sizes: detail.variants.map((v) => v.size || "OS"),
      imageUrls: images,
      swatches: [],
      reviews: 0,
    },
    variants: detail.variants,
    images,
    vendorSlug: p.vendor_slug,
  };
}
