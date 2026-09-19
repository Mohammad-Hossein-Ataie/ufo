"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useProductCardCarousel } from "@/hooks/use-product-card-carousel";
import type { CarouselImage } from "@/lib/product-carousel-image";

const DeckContext = createContext<ReturnType<typeof useProductCardCarousel> | null>(null);

export function useHomepageProductDeck() {
  const deck = useContext(DeckContext);
  if (!deck) throw new Error("HomepageProductSlot requires HomepageProductDeck");
  return deck;
}

export function HomepageProductDeck({
  images,
  children,
}: {
  images: CarouselImage[][];
  children: ReactNode;
}) {
  const carousel = useProductCardCarousel(images);
  return (
    <DeckContext.Provider value={carousel}>
      <div
        ref={carousel.containerRef}
        className="homepage-product-deck mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4"
        data-phase={carousel.phase}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") carousel.pause("hover");
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") carousel.resume("hover");
        }}
        onFocusCapture={() => carousel.pause("focus")}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) carousel.resume("focus");
        }}
      >
        {children}
      </div>
    </DeckContext.Provider>
  );
}
