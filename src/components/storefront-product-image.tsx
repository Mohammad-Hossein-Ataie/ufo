"use client";

import { createContext, useContext, useState } from "react";
import type { PreparedCarouselImage } from "@/lib/product-carousel-image";
export const StorefrontProductImageSource = createContext<PreparedCarouselImage | null>(null);
import { ProtectedProductImage } from "@/components/protected-product-image";
import { ImageLightbox } from "@/components/image-lightbox";
import { ZoomIn } from "lucide-react";

interface StorefrontProductImageProps {
  src: string;
  fallbackSrc: string;
  alt: string;
  className?: string;
  sizes?: string;
  zoomable?: boolean;
  viewerTone?: "dark" | "light";
}

export function StorefrontProductImage({
  src,
  fallbackSrc,
  alt,
  className,
  sizes = "(min-width: 1024px) 28vw, 50vw",
  zoomable = false,
  viewerTone = "dark",
}: StorefrontProductImageProps) {
  const [failedSrc, setFailedSrc] = useState<string>();
  const [imageOpen, setImageOpen] = useState(false);
  const prepared = useContext(StorefrontProductImageSource);
  const currentSrc =
    prepared?.src === src ? prepared.resolvedSrc : !src || failedSrc === src ? fallbackSrc : src;
  const imageClassName = className ?? "h-full w-full object-contain";

  return (
    <span className="relative block h-full w-full">
      <ProtectedProductImage
        src={currentSrc || fallbackSrc}
        alt={alt}
        fill
        sizes={sizes}
        loading="lazy"
        unoptimized
        className={imageClassName}
        onError={() => setFailedSrc(src)}
      />
      {zoomable ? (
        <>
          <button
            type="button"
            onClick={() => setImageOpen(true)}
            aria-label={`بزرگ‌نمایی تصویر ${alt}`}
            aria-haspopup="dialog"
            className="absolute inset-0 cursor-zoom-in focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ui-focus)]"
          >
            <span
              className="absolute bottom-3 end-3 rounded-full border border-white/25 bg-black/60 p-2 text-white"
              aria-hidden="true"
            >
              <ZoomIn size={20} />
            </span>
          </button>
          <ImageLightbox
            open={imageOpen}
            onClose={() => setImageOpen(false)}
            src={currentSrc || fallbackSrc}
            alt={alt}
            tone={viewerTone}
          />
        </>
      ) : null}
    </span>
  );
}
