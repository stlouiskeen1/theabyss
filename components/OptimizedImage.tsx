"use client";

import Image from "next/image";
import { useState, useMemo } from "react";
import { supabaseImageLoader, generateSizes } from "@/lib/supabase-image-loader";

type OptimizedImageProps = {
  /** Image source URL (Supabase Storage, local path, or external) */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Display width in pixels */
  width: number;
  /** Display height in pixels */
  height: number;
  /** Blur placeholder (blurhash string or base64 data URL) */
  blurPlaceholder?: string;
  /** Priority loading (above the fold) */
  priority?: boolean;
  /** Loading strategy */
  loading?: "lazy" | "eager";
  /** CSS class name */
  className?: string;
  /** Object fit */
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  /** Object position */
  objectPosition?: string;
  /** Custom sizes attribute */
  sizes?: string;
  /** Custom loader function */
  loader?: (props: { src: string; width: number; quality?: number }) => string;
  /** Quality for Supabase transformations (1-100) */
  quality?: number;
  /** Whether to use Supabase image transformations */
  useTransformations?: boolean;
};

const PLACEHOLDER_BLURHASH = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  blurPlaceholder,
  priority = false,
  loading = "lazy",
  className = "",
  objectFit = "cover",
  objectPosition = "center",
  sizes,
  loader,
  quality = 80,
  useTransformations = true,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const effectiveLoader = useMemo(() => {
    if (loader) return loader;
    if (useTransformations) return supabaseImageLoader;
    return undefined;
  }, [loader, useTransformations]);

  const effectiveSizes = useMemo(() => {
    if (sizes) return sizes;
    if (useTransformations) return generateSizes();
    return "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw";
  }, [sizes, useTransformations]);

  const handleLoad = () => setIsLoading(false);
  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const blurDataUrl = useMemo(() => {
    if (blurPlaceholder) return blurPlaceholder;
    if (hasError) return PLACEHOLDER_BLURHASH;
    return undefined;
  }, [blurPlaceholder, hasError]);

  if (hasError && src.startsWith("http")) {
    return (
      <div
        className={`relative overflow-hidden ${className}`}
        style={{ width, height }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 bg-surface-container flex items-center justify-center"
          style={{ width, height }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-text-muted mx-auto"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 17" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        loader={effectiveLoader}
        sizes={effectiveSizes}
        quality={quality}
        priority={priority}
        loading={loading}
        placeholder={blurDataUrl ? "blur" : "empty"}
        blurDataURL={blurDataUrl}
        objectFit={objectFit}
        objectPosition={objectPosition}
        className={`${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        style={{ objectFit, objectPosition }}
      />
      {isLoading && blurDataUrl && (
        <div
          className="absolute inset-0"
          style={{
            filter: "blur(20px)",
            transform: "scale(1.1)",
            backgroundImage: `url(${blurDataUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}


