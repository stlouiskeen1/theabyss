import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listOrdersBySub } from "@/lib/orders.server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let supabase;
    try {
      supabase = await createClient();
    } catch {
      return NextResponse.json(
        { error: "Supabase is not configured (missing URL / anon key)" },
        { status: 500 }
      );
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const sub = user?.id;
    if (!sub) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json(await listOrdersBySub(sub));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
