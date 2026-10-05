import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getVendorAnalytics } from "@/lib/vendors.server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const params = new URL(req.url).searchParams;
  const vendorId = params.get("vendorId");
  const days = Math.max(1, Math.min(365, Number(params.get("days") ?? 30) || 30));
  if (!vendorId) return NextResponse.json({ error: "vendorId is required" }, { status: 400 });

  try {
    const analytics = await getVendorAnalytics(user.id, vendorId, days);
    return NextResponse.json({ analytics });
  } catch (e) {
    const msg = (e as Error).message;
    return NextResponse.json(
      { error: msg },
      { status: msg.includes("forbidden") ? 403 : 500 }
    );
  }
}
