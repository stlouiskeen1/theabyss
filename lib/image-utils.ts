"use client";

import * as blurhash from "blurhash";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"] as const;
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const MAX_IMAGES = 8;
const MAX_DIMENSION = 2000;
const COMPRESSION_QUALITY = 0.8;

/** Generate a base64 LQIP (low-quality image placeholder) from a file.
 *  Uses blurhash for a compact ~30-char string that Next.js Image can decode. */
export async function generateLQIP(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return reject(new Error("Canvas context unavailable"));

      // Downsample to small size for blurhash (max 32x32)
      const maxDim = 32;
      let { width, height } = img;
      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      const imageData = ctx.getImageData(0, 0, width, height);
      try {
        const hash = blurhash.encode(imageData.data, width, height, 4, 4);
        resolve(hash);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error("Failed to load image for LQIP"));

    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("FileReader failed"));
    reader.readAsDataURL(new Blob([arrayBuffer], { type: file.type }));
  });
}

/** Validate file before upload. Returns error message or null if valid. */
export function validateImageFile(file: File, existingCount = 0): string | null {
  const allowedTypes = ALLOWED_TYPES as readonly string[];
  if (!allowedTypes.includes(file.type)) {
    return `Unsupported file type: ${file.type}. Allowed: JPEG, PNG, WebP, HEIC.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 8MB.`;
  }
  if (existingCount >= MAX_IMAGES) {
    return `Maximum ${MAX_IMAGES} images per product.`;
  }
  return null;
}

/** Compress and resize image client-side before upload. */
export async function compressImage(file: File): Promise<Blob> {
  const { default: imageCompression } = await import("browser-image-compression");

  const options = {
    maxSizeMB: 8,
    maxWidthOrHeight: MAX_DIMENSION,
    useWebWorker: true,
    fileType: file.type,
    initialQuality: COMPRESSION_QUALITY,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.warn("Compression failed, using original:", error);
    return file;
  }
}

/** Get image dimensions from a file/blob. */
export async function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("Failed to load image for dimensions"));
    };
    img.src = URL.createObjectURL(blob);
  });
}

/** Process image file: validate, compress, get dimensions, generate LQIP. */
export async function processImageFile(
  file: File,
  existingCount = 0
): Promise<{
  compressedBlob: Blob;
  width: number;
  height: number;
  blurhash: string;
  mimeType: string;
}> {
  const validationError = validateImageFile(file, existingCount);
  if (validationError) throw new Error(validationError);

  const [compressedBlob, blurhash, dimensions] = await Promise.all([
    compressImage(file),
    generateLQIP(file),
    getImageDimensions(file),
  ]);

  return {
    compressedBlob,
    width: dimensions.width,
    height: dimensions.height,
    blurhash,
    mimeType: file.type,
  };
}

/** Read file as base64 data URL. */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/** Create a file input element for image selection. */
export function createImageInput(
  accept = ALLOWED_TYPES.join(","),
  multiple = true
): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = accept;
  input.multiple = multiple;
  input.style.display = "none";
  return input;
}

/** Trigger file picker and return selected files. */
export function pickImages(
  maxFiles = MAX_IMAGES,
  accept = ALLOWED_TYPES.join(",")
): Promise<FileList | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.multiple = true;
    input.style.display = "none";
    input.onchange = () => {
      if (input.files && input.files.length > 0) {
        // Enforce max files
        const files = Array.from(input.files).slice(0, maxFiles);
        const dt = new DataTransfer();
        files.forEach((f) => dt.items.add(f));
        resolve(dt.files);
      } else {
        resolve(null);
      }
      input.remove();
    };
    input.click();
  });
}

export { ALLOWED_TYPES, MAX_FILE_SIZE, MAX_IMAGES, MAX_DIMENSION, COMPRESSION_QUALITY };