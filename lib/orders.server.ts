import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";

/*
 * Server-side Supabase client (service role).
 *
 * Imported ONLY by route handlers / server components. The service role key is
 * never shipped to the browser; requests to these routes are additionally
 * gated by the Auth0 session + admin allowlist in the route handlers.
 */

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAILS = (process.env.AUTH0_ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter((e) => e.length > 0);

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

/** Minimal structural slice of the Auth0 session we rely on. */
type SessionLike = { user?: { email?: string | null } | null };

/** Fail-closed admin check: absent config ⇒ nobody is an admin. */
export function isAdmin(session: SessionLike | null): boolean {
  if (ADMIN_EMAILS.length === 0) return false;
  const email = session?.user?.email?.trim().toLowerCase();
  return Boolean(email && ADMIN_EMAILS.includes(email));
}

async function call(name: string, args?: Record<string, unknown>) {
  const supabase = admin();
  if (!supabase) throw new Error("Supabase service role is not configured");
  const { data, error } = await supabase.rpc(name as never, (args ?? {}) as never);
  if (error) throw new Error(error.message);
  return (data as unknown as Json[]) ?? [];
}

export function listAllOrders() {
  return call("order_list_all");
}

export function listOrdersBySub(sub: string) {
  return call("order_list_by_sub", { p_sub: sub });
}

export async function advanceOrder(id: string) {
  await call("order_advance", { p_order_id: id });
}

export async function cancelOrder(id: string) {
  await call("order_cancel", { p_order_id: id });
}

export async function setCollectedOrder(id: string, collected: boolean) {
  await call("order_set_collected", { p_order_id: id, p_collected: collected });
}