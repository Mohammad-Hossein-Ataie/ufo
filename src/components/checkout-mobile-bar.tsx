"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Keep the fixed controls outside the checkout main's isolated stacking context. */
export function CheckoutMobileBar({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const bar = ref.current;
    if (!bar) return;
    const root = document.documentElement;
    const nav = document.querySelector(".mobile-bottom-nav");
    const update = () => {
      root.style.setProperty("--checkout-cta-height", `${bar.getBoundingClientRect().height}px`);
      if (nav) bar.style.bottom = `${nav.getBoundingClientRect().height}px`;
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(bar);
    if (nav) observer.observe(nav);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--checkout-cta-height");
    };
  }, []);

  // Checkout mounts this only after loading its session in an effect.
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      ref={ref}
      data-testid="checkout-mobile-cta"
      className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 border-t border-white/10 bg-[#090d13]/96 p-3 backdrop-blur-xl lg:hidden"
    >
      {children}
    </div>,
    document.body,
  );
}
