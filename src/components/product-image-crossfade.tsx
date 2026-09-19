"use client";

import { useEffect, useState } from "react";
import { ProtectedProductImage } from "@/components/protected-product-image";
import { prepareCarouselImage } from "@/lib/product-carousel-image";

type Frame = { src: string; alt: string };

/** Keep the old image intact until the requested image is decoded. Rapid choices
 * coalesce behind the current fade, so there is never an empty gallery frame. */
export function ProductImageCrossfade({ src, alt }: Frame) {
  const [current, setCurrent] = useState<Frame>({ src, alt });
  const [incoming, setIncoming] = useState<Frame>();

  useEffect(() => {
    if (incoming || src === current.src) return;
    const controller = new AbortController();
    void prepareCarouselImage({ src, fallbackSrc: current.src }, controller.signal).then(
      (image) => {
        if (controller.signal.aborted || !image || image.resolvedSrc === current.src) return;
        const frame = { src: image.resolvedSrc, alt };
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setCurrent(frame);
        else setIncoming(frame);
      },
    );
    return () => controller.abort();
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
        className="object-cover"
        sizes="(min-width: 1024px) 47vw, 100vw"
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
          className="product-image-crossfade-in object-cover"
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
