"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";

/** Visible server markup; only animate once observation confirms viewport entry. */
export function MotionReveal({ className = "", ...props }: ComponentPropsWithoutRef<"div">) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || !("IntersectionObserver" in window)) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        node.dataset.revealed = "true";
        observer.disconnect();
      },
      { threshold: 0, rootMargin: "0px 0px -24px 0px" },
    );
    // Once reduced motion is requested, do not resume/replay this reveal.
    const stop = () => {
      if (preference.matches) {
        observer.disconnect();
        node.removeAttribute("data-revealed");
      }
    };
    observer.observe(node);
    preference.addEventListener("change", stop);
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", stop);
    };
  }, []);
  return <div {...props} ref={ref} className={`motion-reveal ${className}`} />;
}
