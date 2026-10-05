import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listVendorOrders, listVendorPayouts } from "@/lib/vendors.server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const vendorId = new URL(req.url).searchParams.get("vendorId");
  if (!vendorId) {
    return NextResponse.json({ error: "vendorId is required" }, { status: 400 });
  }

  try {
    const [orders, payouts] = await Promise.all([
      listVendorOrders(user.id, vendorId),
      listVendorPayouts(user.id, vendorId),
    ]);
    return NextResponse.json({ orders, payouts });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg.includes("forbidden") ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
