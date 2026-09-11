import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import {
  advanceOrder,
  cancelOrder,
  isAdmin,
  listAllOrders,
  setCollectedOrder,
} from "@/lib/orders.server";

export const dynamic = "force-dynamic";

type AdminGuard = { ok: true } | { ok: false; status: number };

async function requireAdmin(): Promise<AdminGuard> {
  const session = await auth0.getSession();
  if (!session) return { ok: false, status: 401 };
  if (!isAdmin(session)) return { ok: false, status: 403 };
  return { ok: true };
}

const deny = (status: number) =>
  NextResponse.json({ error: status === 401 ? "unauthorized" : "forbidden" }, { status });

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return deny(guard.status);
  try {
    return NextResponse.json(await listAllOrders());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return deny(guard.status);

  const body = (await req.json().catch(() => null)) as
    | { action?: string; orderId?: string; collected?: boolean }
    | null;
  const orderId = body?.orderId;
  if (typeof orderId !== "string" || orderId.length === 0) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  try {
    if (body?.action === "advance") {
      await advanceOrder(orderId);
    } else if (body?.action === "cancel") {
      await cancelOrder(orderId);
    } else if (body?.action === "collect") {
      await setCollectedOrder(orderId, Boolean(body.collected));
    } else {
      return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
    return NextResponse.json(await listAllOrders());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}