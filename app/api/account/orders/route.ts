import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { listOrdersBySub } from "@/lib/orders.server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth0.getSession();
  const sub = session?.user?.sub;
  if (!sub) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json(await listOrdersBySub(sub));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}