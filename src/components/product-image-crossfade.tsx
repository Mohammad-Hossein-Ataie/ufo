"use client";

import { useEffect, useRef, useState } from "react";
import { ProtectedProductImage } from "@/components/protected-product-image";
import { createGalleryImageCache } from "@/lib/gallery-image-cache";

type Frame = { src: string; alt: string };
const noPreloadSources: string[] = [];

/** Keep the old image intact until the requested image is decoded. Rapid choices
 * coalesce behind the current fade, so there is never an empty gallery frame. */
export function ProductImageCrossfade({
  src,
  alt,
  preloadSources = noPreloadSources,
}: Frame & { preloadSources?: string[] }) {
  const [current, setCurrent] = useState<Frame>({ src, alt });
  const [incoming, setIncoming] = useState<Frame>();
  const [firstFrameReady, setFirstFrameReady] = useState(false);
  const cache = useRef<ReturnType<typeof createGalleryImageCache> | null>(null);
  if (!cache.current) cache.current = createGalleryImageCache();

  useEffect(() => () => cache.current?.dispose(), []);

  useEffect(() => {
    if (!firstFrameReady) return;
    const connection = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? "")) return;
    const warm = () => {
      if (!document.hidden) void cache.current?.warm(preloadSources);
    };
    warm();
    document.addEventListener("visibilitychange", warm);
    return () => document.removeEventListener("visibilitychange", warm);
  }, [firstFrameReady, preloadSources]);

  useEffect(() => {
    if (incoming || src === current.src) return;
    let cancelled = false;
    void cache.current!.load(src).then((image) => {
      if (cancelled || !image || image.resolvedSrc === current.src) return;
      const frame = { src: image.resolvedSrc, alt };
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setCurrent(frame);
      else setIncoming(frame);
    });
    return () => {
      cancelled = true;
    };
  }, [src, alt, current.src, incoming]);

  useEffect(() => {
    if (!incoming) return;
    const finish = () => {
      setCurrent(incoming);
      setIncoming(undefined);
    };
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motionChanged = () => {
      if (media.matches) finish();
    };
    const timer = setTimeout(finish, 680);
    media.addEventListener("change", motionChanged);
    return () => {
      clearTimeout(timer);
      media.removeEventListener("change", motionChanged);
    };
  }, [incoming]);

  return (
    <div className="absolute inset-0" data-product-crossfade data-transitioning={Boolean(incoming)}>
      <ProtectedProductImage
        src={current.src}
        alt={current.src === src ? alt : current.alt}
        fill
        loading="eager"
        unoptimized
        className="object-contain"
        sizes="(min-width: 1024px) 47vw, 100vw"
        onLoad={() => setFirstFrameReady(true)}
      />
      {incoming ? (
        <ProtectedProductImage
          key={incoming.src}
          src={incoming.src}
          alt=""
          aria-hidden="true"
          fill
          loading="eager"
          unoptimized
          className="product-image-crossfade-in object-contain"
          sizes="(min-width: 1024px) 47vw, 100vw"
          onAnimationEnd={() => {
            setCurrent(incoming);
            setIncoming(undefined);
          }}
        />
      ) : null}
    </div>
  );
}
