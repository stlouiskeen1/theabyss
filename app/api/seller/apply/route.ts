import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { applyVendor } from "@/lib/vendors.server";

export const dynamic = "force-dynamic";

type Body = {
  name?: unknown;
  slug?: unknown;
  description?: unknown;
  wilayaId?: unknown;
  communeId?: unknown;
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as Body | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const slug = typeof body?.slug === "string" ? body.slug.trim().toLowerCase() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : null;
  const wilayaId =
    typeof body?.wilayaId === "number" && Number.isInteger(body.wilayaId) ? body.wilayaId : null;
  const communeId =
    typeof body?.communeId === "string" && body.communeId.trim()
      ? Number.NaN
      : typeof body?.communeId === "number" && Number.isInteger(body.communeId)
        ? (body.communeId as number)
        : null;

  if (!name || !slug) {
    return NextResponse.json({ error: "name and slug are required" }, { status: 400 });
  }

  try {
    const vendor = await applyVendor(user.id, {
      name,
      slug,
      description: description || null,
      wilayaId,
      communeId: Number.isNaN(communeId as number) ? null : communeId,
    });
    return NextResponse.json({ vendor });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg.includes("slug_taken") ? 409 : 400;
    return NextResponse.json({ error: msg.replace("vendor_apply: ", "") }, { status });
  }
}
