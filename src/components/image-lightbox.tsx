"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ChevronDown, ChevronUp, Images, X } from "lucide-react";
import { ModalSurface } from "@/components/modal-surface";
import { ProtectedProductImage } from "@/components/protected-product-image";

export interface ImageLightboxItem {
  src: string;
  alt: string;
}

/** Show the existing protected derivative, never request or link to an original. */
export function ImageLightbox({
  open,
  onClose,
  src,
  alt,
  images,
  tone = "dark",
}: {
  open: boolean;
  onClose: () => void;
  src: string;
  alt: string;
  images?: ImageLightboxItem[];
  tone?: "dark" | "light";
}) {
  const slides = useMemo(() => {
    const unique = new Map<string, ImageLightboxItem>();
    for (const item of images?.length ? images : [{ src, alt }]) {
      if (item.src && !unique.has(item.src)) unique.set(item.src, item);
    }
    if (src && !unique.has(src)) unique.set(src, { src, alt });
    return [...unique.values()];
  }, [alt, images, src]);
  const selectedIndex = Math.max(0, slides.findIndex((item) => item.src === src));
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLElement | null>>([]);
  const isGallery = slides.length > 1;

  function scrollToIndex(index: number, behavior: ScrollBehavior = "smooth") {
    const scroller = scrollerRef.current;
    const slide = slideRefs.current[index];
    if (!scroller || !slide) return;
    scroller.scrollTo({ top: slide.offsetTop, behavior });
  }

  useEffect(() => {
    if (!open || !isGallery) return;
    setActiveIndex(selectedIndex);
    const frame = window.requestAnimationFrame(() => scrollToIndex(selectedIndex, "auto"));
    return () => window.cancelAnimationFrame(frame);
  }, [isGallery, open, selectedIndex]);

  function syncActiveSlide() {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    let nearest = 0;
    let distance = Number.POSITIVE_INFINITY;
    slideRefs.current.forEach((slide, index) => {
      if (!slide) return;
      const nextDistance = Math.abs(slide.offsetTop - scroller.scrollTop);
      if (nextDistance < distance) {
        nearest = index;
        distance = nextDistance;
      }
    });
    setActiveIndex(nearest);
  }

  function handleGalleryKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowDown" && event.key !== "PageDown" && event.key !== "ArrowUp" && event.key !== "PageUp") return;
    event.preventDefault();
    const direction = event.key === "ArrowDown" || event.key === "PageDown" ? 1 : -1;
    scrollToIndex(Math.min(Math.max(activeIndex + direction, 0), slides.length - 1));
  }

  const currentAlt = slides[activeIndex]?.alt ?? alt;

  return (
    <ModalSurface
      open={open}
      onClose={onClose}
      title="نمای بزرگ تصویر"
      overlayClassName="image-viewer-overlay backdrop-blur-[12px]"
    >
      <section
        className={`image-viewer-panel rounded-2xl border shadow-2xl ${isGallery ? "flex h-[calc(100dvh-2rem)] flex-col overflow-hidden" : ""} ${tone === "light" ? "border-[#D5D9C9] bg-[#F7F7F2] text-[#14201B]" : "border-white/20 bg-[#0D1117] text-white"}`}
      >
        <div className={`flex min-h-14 shrink-0 items-center justify-between gap-2 border-b px-3 ${tone === "light" ? "border-[#D5D9C9]" : "border-white/10"}`}>
          <div className="min-w-0">
            <p className="truncate text-sm" title={currentAlt}>{currentAlt}</p>
            {isGallery ? <p className={`mt-0.5 flex items-center gap-1 text-[11px] ${tone === "light" ? "text-[#596B61]" : "text-white/55"}`}><Images size={12} aria-hidden="true" /> اسکرول برای دیدن تصاویر دیگر</p> : null}
          </div>
          {isGallery ? (
            <div className="mr-auto flex shrink-0 items-center gap-1">
              <button type="button" onClick={() => scrollToIndex(activeIndex - 1)} disabled={activeIndex === 0} aria-label="تصویر قبلی" className={`inline-flex h-10 w-10 items-center justify-center rounded-lg disabled:opacity-30 ${tone === "light" ? "hover:bg-black/5" : "hover:bg-white/10"}`}><ChevronUp size={19} aria-hidden="true" /></button>
              <span className="min-w-14 text-center text-xs tabular-nums" aria-live="polite">{(activeIndex + 1).toLocaleString("fa-IR")} از {slides.length.toLocaleString("fa-IR")}</span>
              <button type="button" onClick={() => scrollToIndex(activeIndex + 1)} disabled={activeIndex === slides.length - 1} aria-label="تصویر بعدی" className={`inline-flex h-10 w-10 items-center justify-center rounded-lg disabled:opacity-30 ${tone === "light" ? "hover:bg-black/5" : "hover:bg-white/10"}`}><ChevronDown size={19} aria-hidden="true" /></button>
            </div>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن تصویر"
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg focus-visible:outline focus-visible:outline-2 ${tone === "light" ? "hover:bg-black/5 focus-visible:outline-[#176D48]" : "hover:bg-white/10 focus-visible:outline-cyan-300"}`}
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        {isGallery ? (
          <div
            ref={scrollerRef}
            data-testid="image-lightbox-scroller"
            data-active-index={activeIndex}
            tabIndex={0}
            onScroll={syncActiveSlide}
            onKeyDown={handleGalleryKeyDown}
            className={`relative min-h-0 flex-1 snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-b-2xl scroll-smooth focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 ${tone === "light" ? "bg-[#EEF0E5] focus-visible:outline-[#176D48]" : "bg-[#141A22] focus-visible:outline-cyan-300"}`}
          >
            {slides.map((item, index) => (
              <figure
                key={item.src}
                ref={(element) => { slideRefs.current[index] = element; }}
                data-lightbox-slide
                className={`flex min-h-full snap-start items-center justify-center ${index > 0 ? tone === "light" ? "border-t border-[#D5D9C9]" : "border-t border-white/10" : ""}`}
              >
                <div className="relative aspect-[3/4] w-full shrink-0">
                  <ProtectedProductImage
                    src={item.src}
                    alt={activeIndex === index ? item.alt : ""}
                    aria-hidden={activeIndex !== index}
                    fill
                    unoptimized
                    loading={index === selectedIndex ? "eager" : "lazy"}
                    sizes="(min-width: 1024px) 900px, calc(100vw - 32px)"
                    className="object-contain"
                  />
                </div>
              </figure>
            ))}
          </div>
        ) : (
          <div className={`relative aspect-[3/4] overflow-hidden rounded-b-2xl ${tone === "light" ? "bg-[#EEF0E5]" : "bg-[#141A22]"}`}>
            <ProtectedProductImage src={src} alt={alt} fill unoptimized loading="eager" sizes="(min-width: 1024px) 900px, calc(100vw - 32px)" className="object-contain" />
          </div>
        )}
      </section>
    </ModalSurface>
  );
}
