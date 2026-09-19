"use client";

import { useId, useRef, type CSSProperties, type ReactNode } from "react";
import { productCarouselHalfTransition } from "@/hooks/use-product-card-carousel";
import { useHomepageProductDeck } from "@/components/homepage-product-deck";
import { StorefrontProductImageSource } from "@/components/storefront-product-image";

export function HomepageProductSlot({
  children,
  names,
  label,
  slotIndex,
}: {
  children: ReactNode[];
  names: string[];
  label: string;
  slotIndex: number;
}) {
  const carousel = useHomepageProductDeck();
  const id = useId();
  const touch = useRef<{ id: number; x: number; y: number; vertical: boolean } | undefined>(
    undefined,
  );
  const suppressClick = useRef(false);
  const active = carousel.activeIndex % children.length;
  const hasChoices = children.length > 1;
  const sign = (carousel.rtl ? 1 : -1) * carousel.direction;

  return (
    <div
      className="homepage-product-slot grid min-w-0 grid-rows-[auto_1fr_auto]"
      data-active-index={active}
      data-phase={carousel.phase}
      data-motion-direction={sign}
      style={{ "--carousel-phase-duration": `${productCarouselHalfTransition}ms` } as CSSProperties}
    >
      <div className="mb-3 flex min-h-11 items-center justify-between gap-2">
        <p className="truncate text-sm font-bold text-retail-secondary">{label}</p>
      </div>
      <div
        id={id}
        className="homepage-product-perspective grid min-w-0 touch-pan-y touch-pinch-zoom"
        role="group"
        aria-roledescription="اسلاید محصول"
        aria-label={`${label}؛ محصول ${active + 1} از ${children.length}`}
        onPointerDown={(event) => {
          suppressClick.current = false;
          if (event.pointerType !== "touch" || !hasChoices) return;
          touch.current = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            vertical: false,
          };
          carousel.pause("touch");
        }}
        onPointerMove={(event) => {
          const start = touch.current;
          if (!start || start.id !== event.pointerId) return;
          const dx = Math.abs(event.clientX - start.x);
          const dy = Math.abs(event.clientY - start.y);
          if (dy > 10 && dy > dx) start.vertical = true;
        }}
        onPointerUp={(event) => {
          const start = touch.current;
          if (!start || start.id !== event.pointerId) return;
          const dx = event.clientX - start.x;
          const dy = event.clientY - start.y;
          if (!start.vertical && Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.3) {
            suppressClick.current = true;
            if (dx > 0 === carousel.rtl) carousel.next();
            else carousel.previous();
          }
          touch.current = undefined;
          carousel.resume("touch");
        }}
        onPointerCancel={() => {
          touch.current = undefined;
          carousel.resume("touch");
        }}
        onClickCapture={(event) => {
          if (suppressClick.current && event.detail > 0) {
            event.preventDefault();
            event.stopPropagation();
            suppressClick.current = false;
          }
        }}
      >
        <StorefrontProductImageSource.Provider value={carousel.images?.[slotIndex] ?? null}>
          <div
            key={active}
            className="homepage-product-slide grid min-w-0"
            data-phase={carousel.phase}
            style={
              {
                "--carousel-sign": sign,
              } as CSSProperties
            }
          >
            {children[active]}
          </div>
        </StorefrontProductImageSource.Provider>
      </div>
      <div
        className="flex h-12 items-center justify-center"
        role="group"
        aria-label={`محصولات ${label}`}
        onKeyDown={(event) => {
          const current = Number((event.target as HTMLElement).dataset.slideIndex);
          if (!Number.isInteger(current)) return;
          let target: number;
          if (event.key === "ArrowLeft") target = current + (carousel.rtl ? 1 : -1);
          else if (event.key === "ArrowRight") target = current + (carousel.rtl ? -1 : 1);
          else if (event.key === "Home") target = 0;
          else if (event.key === "End") target = children.length - 1;
          else return;
          event.preventDefault();
          const normalized = (target + children.length) % children.length;
          event.currentTarget
            .querySelector<HTMLButtonElement>(`[data-slide-index="${normalized}"]`)
            ?.focus();
          void carousel.goTo(normalized, "manual", target < current ? -1 : 1);
        }}
      >
        {hasChoices ? (
          names.map((name, index) => (
            <button
              key={index}
              type="button"
              data-slide-index={index}
              aria-label={`نمایش محصول ${index + 1} از ${children.length}: ${name}`}
              aria-pressed={index === active}
              aria-controls={id}
              onClick={() => void carousel.goTo(index, "manual", index < active ? -1 : 1)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-retail-accent"
            >
              <span
                className={`homepage-product-indicator h-1.5 w-5 rounded-full ${index === active ? "bg-retail-accent" : "bg-retail-secondary"}`}
                data-active={index === active}
              />
            </button>
          ))
        ) : (
          <span className="h-1.5 w-5 rounded-full bg-white/20" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
