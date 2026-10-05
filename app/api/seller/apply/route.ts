import { NextResponse } from "next/server";
import { applyVendor, routeErrorResponse, sessionOwnerId } from "@/lib/vendors.server";

export const dynamic = "force-dynamic";

type Body = {
  name?: unknown;
  slug?: unknown;
  description?: unknown;
  wilayaId?: unknown;
  communeId?: unknown;
};

const intOrNull = (v: unknown): number | null =>
  typeof v === "number" && Number.isInteger(v) ? v : null;

export async function POST(req: Request) {
  try {
    const owner = await sessionOwnerId();

    const body = (await req.json().catch(() => null)) as Body | null;
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const slug = typeof body?.slug === "string" ? body.slug.trim().toLowerCase() : "";
    const description =
      typeof body?.description === "string" ? body.description.trim() || null : null;

    if (!name || !slug) {
      return NextResponse.json({ error: "name and slug are required" }, { status: 400 });
    }

    try {
      const vendor = await applyVendor(owner, {
        name,
        slug,
        description,
        wilayaId: intOrNull(body?.wilayaId),
        communeId: intOrNull(body?.communeId),
      });
      return NextResponse.json({ vendor });
    } catch (e) {
      const msg = (e as Error).message;
      const status = msg.includes("slug_taken") ? 409 : 400;
      return NextResponse.json({ error: msg.replace("vendor_apply: ", "") }, { status });
    }
  } catch (e) {
    return routeErrorResponse(e);
  }
}
