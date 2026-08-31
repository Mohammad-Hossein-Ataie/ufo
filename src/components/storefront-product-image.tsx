"use client";

import Image from "next/image";
import { useState } from "react";

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
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);
  const imageClassName =
    className ??
    "h-full w-full object-contain p-4 transition duration-200 group-hover:scale-[1.03] motion-reduce:transition-none";

  return (
    <span className="relative block h-full w-full">
      <Image
        src={currentSrc || fallbackSrc}
        alt={alt}
        fill
        sizes={sizes}
        loading="lazy"
        unoptimized
        className={imageClassName}
        onError={() => setCurrentSrc(fallbackSrc)}
      />
    </span>
  );
}
