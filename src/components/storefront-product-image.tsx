"use client";

import { createContext, useContext, useState } from "react";
import type { PreparedCarouselImage } from "@/lib/product-carousel-image";
export const StorefrontProductImageSource = createContext<PreparedCarouselImage | null>(null);
import { ProtectedProductImage } from "@/components/protected-product-image";

interface StorefrontProductImageProps {
  src: string;
  fallbackSrc: string;
  alt: string;
  className?: string;
  sizes?: string;
}

export function StorefrontProductImage({
  src,
  fallbackSrc,
  alt,
  className,
  sizes = "(min-width: 1024px) 28vw, 50vw",
}: StorefrontProductImageProps) {
  const [failedSrc, setFailedSrc] = useState<string>();
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
    </span>
  );
}
