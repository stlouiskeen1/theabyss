import { NextResponse } from "next/server";
import { routeErrorResponse, sessionOwnerId, uploadProductImage } from "@/lib/vendors.server";

export const dynamic = "force-dynamic";

const MAX_IMAGES = 8;
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"] as const;

export async function POST(req: Request) {
  try {
    const owner = await sessionOwnerId();
    const form = await req.formData().catch(() => null);
    const vendorId = form?.get("vendorId");
    const blurhash = (form?.get("blurhash") as string) || undefined;
    const width = form?.get("width") ? parseInt(form.get("width") as string, 10) : undefined;
    const height = form?.get("height") ? parseInt(form.get("height") as string, 10) : undefined;

    if (typeof vendorId !== "string" || !vendorId) {
      return NextResponse.json({ error: "vendorId is required" }, { status: 400 });
    }

    // Get all files from form data
    const files: File[] = [];
    for (const [key, value] of form?.entries() ?? []) {
      if (key === "file" && value instanceof Blob) {
        files.push(value as File);
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "At least one file is required" }, { status: 400 });
    }

    if (files.length > MAX_IMAGES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_IMAGES} images per request` },
        { status: 400 }
      );
    }

    // Validate each file
    for (const file of files) {
      const mime = file.type as typeof ALLOWED_MIME_TYPES[number];
      if (!ALLOWED_MIME_TYPES.includes(mime)) {
        return NextResponse.json(
          { error: `Unsupported file type: ${file.type}. Allowed: JPEG, PNG, WebP, HEIC.` },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 8MB.` },
          { status: 400 }
        );
      }
    }

    try {
      const results = await Promise.all(
        files.map(async (file, index) => {
          const arrayBuffer = await file.arrayBuffer();
          const result = await uploadProductImage(owner, vendorId, arrayBuffer, file.type, file.size, {
            blurhash,
            width,
            height,
          });
          return { ...result, index };
        })
      );

      // Return single image result for backward compatibility with client
      if (results.length === 1) {
        const { url, ...rest } = results[0];
        return NextResponse.json({ url, ...rest });
      }
      return NextResponse.json({ images: results });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const status = msg === "forbidden" ? 403 : 400;
      return NextResponse.json({ error: msg }, { status });
    }
  } catch (e) {
    return routeErrorResponse(e);
  }
}