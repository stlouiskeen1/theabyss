"use client";

import { decode } from "blurhash";

/**
 * BlurHash → tiny PNG data URL.
 *
 * next/image's `blurDataURL` prop expects a base64 image, not a BlurHash
 * string, so the hash has to be decoded into pixels first. The result is a
 * 16×16 PNG — a few hundred bytes — used as the placeholder behind the real
 * photo while it streams in.
 *
 * Results are memoised per hash: a grid can render the same product cover
 * dozens of times and decoding it repeatedly is pure waste.
 */

const cache = new Map<string, string | undefined>();
const SIZE = 16;

export function blurhashToDataUrl(hash: string | null | undefined): string | undefined {
  if (!hash) return undefined;

  const cached = cache.get(hash);
  if (cached !== undefined) return cached;

  let out: string | undefined;
  try {
    const pixels = decode(hash, SIZE, SIZE);
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const imageData = ctx.createImageData(SIZE, SIZE);
      imageData.data.set(pixels);
      ctx.putImageData(imageData, 0, 0);
      out = canvas.toDataURL("image/png");
    }
  } catch {
    // Malformed hash — fall back to no placeholder rather than breaking render.
    out = undefined;
  }

  cache.set(hash, out);
  return out;
}
