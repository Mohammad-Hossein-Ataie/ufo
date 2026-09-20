"use client";

import { X } from "lucide-react";
import { ModalSurface } from "@/components/modal-surface";
import { ProtectedProductImage } from "@/components/protected-product-image";

/** Show the existing protected derivative, never request or link to an original. */
export function ImageLightbox({
  open,
  onClose,
  src,
  alt,
  tone = "dark",
}: {
  open: boolean;
  onClose: () => void;
  src: string;
  alt: string;
  tone?: "dark" | "light";
}) {
  return (
    <ModalSurface
      open={open}
      onClose={onClose}
      title="نمای بزرگ تصویر"
      overlayClassName="image-viewer-overlay backdrop-blur-[12px]"
    >
      <section
        className={`image-viewer-panel rounded-2xl border shadow-2xl ${tone === "light" ? "border-[#D5D9C9] bg-[#F7F7F2] text-[#14201B]" : "border-white/20 bg-[#0D1117] text-white"}`}
      >
        <div className="flex min-h-14 items-center justify-between gap-3 px-3">
          <p className="truncate text-sm" title={alt}>
            {alt}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن تصویر"
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg focus-visible:outline focus-visible:outline-2 ${tone === "light" ? "hover:bg-black/5 focus-visible:outline-[#176D48]" : "hover:bg-white/10 focus-visible:outline-cyan-300"}`}
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        <div
          className={`relative aspect-[3/4] overflow-hidden rounded-b-2xl ${tone === "light" ? "bg-[#EEF0E5]" : "bg-[#141A22]"}`}
        >
          <ProtectedProductImage
            src={src}
            alt={alt}
            fill
            unoptimized
            loading="eager"
            sizes="(min-width: 1024px) 900px, calc(100vw - 32px)"
            className="object-contain"
          />
        </div>
      </section>
    </ModalSurface>
  );
}
