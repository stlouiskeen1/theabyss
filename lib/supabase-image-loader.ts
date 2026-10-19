/**
 * Supabase Image Transformation Loader for Next.js Image
 *
 * Uses Supabase Image Transformations (on-the-fly resizing via Supabase Storage)
 * Docs: https://supabase.com/docs/guides/storage/image-transformations
 *
 * Format: /storage/v1/render/image/public/<bucket>/<path>?width=<w>&height=<h>&quality=<q>&format=<fmt>
 *
 * NOTE: Image Transformations are a paid Supabase feature and must be enabled
 * on the project. When they are not, the render endpoint answers 403
 * FeatureNotEnabled and EVERY seller-uploaded photo breaks. `OptimizedImage`
 * therefore falls back to the plain object URL on error — see
 * `isTransformable()` below and the retry logic in that component.
 */
export function supabaseImageLoader({
  src,
  width,
  quality = 80,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  // If it's a local path or already has a loader, return as-is
  if (src.startsWith("/") || src.startsWith("data:")) {
    return src;
  }

  // Check if it's a Supabase Storage URL
  const supabaseUrlMatch = src.match(
    /^https:\/\/([^.]+)\.supabase\.co\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/
  );

  if (supabaseUrlMatch) {
    const [, projectRef, bucket, path] = supabaseUrlMatch;
    const baseUrl = `https://${projectRef}.supabase.co/storage/v1/render/image/public/${bucket}/${path}`;
    const params = new URLSearchParams();
    params.set("width", width.toString());
    params.set("quality", quality.toString());
    params.set("format", "webp");
    return `${baseUrl}?${params.toString()}`;
  }

  // For other URLs (picsum.photos, local, etc.), return as-is
  return src;
}

/**
 * True when `src` is a Supabase Storage object that `supabaseImageLoader`
 * would rewrite to the (feature-gated) render endpoint. Used by
 * `OptimizedImage` to decide whether an onError retry with the untransformed
 * URL is worth attempting.
 */
export function isTransformable(src: string): boolean {
  if (!src.startsWith("http")) return false;
  return /^https:\/\/[^.]+\.supabase\.co\/storage\/v1\/object\/public\//.test(src);
}

/** Generate responsive sizes string for common breakpoints. */
export function generateSizes(
  breakpoints: { maxWidth: number; size: number }[] = [
    { maxWidth: 640, size: 400 },
    { maxWidth: 1024, size: 800 },
    { maxWidth: 1920, size: 1200 },
  ]
): string {
  return breakpoints
    .map((bp) => `(max-width: ${bp.maxWidth}px) ${bp.size}px`)
    .join(", ") + ` ${breakpoints[breakpoints.length - 1].size}px`;
}

/** Predefined size configs for common use cases. */
export const IMAGE_SIZES = {
  thumbnail: { width: 400, height: 400 },
  productCard: { width: 800, height: 1000 },
  productPage: { width: 900, height: 1200 },
  hero: { width: 1600, height: 1200 },
  zoom: { width: 2000, height: 2000 },
} as const;

/** Generate srcSet for Supabase image transformations. */
export function generateSrcSet(
  baseUrl: string,
  widths: number[] = [400, 800, 1200, 1600, 2000],
  quality = 80
): string {
  return widths
    .map((w) => `${supabaseImageLoader({ src: baseUrl, width: w, quality })} ${w}w`)
    .join(", ");
}