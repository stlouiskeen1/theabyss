import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listOwnVendors } from "@/lib/vendors.server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const vendors = await listOwnVendors(user.id);
    return NextResponse.json({ vendors });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
