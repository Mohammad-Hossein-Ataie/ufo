"use client";

import { useEffect, useState } from "react";

/** Hysteresis keeps small scroll corrections from repeatedly changing geometry. */
export function useHeaderDocked() {
  const [docked, setDocked] = useState(false);

  useEffect(() => {
    let frame = 0;
    let current = false;
    const sync = () => {
      frame = 0;
      const next = current ? window.scrollY > 16 : window.scrollY > 20;
      if (next !== current) {
        current = next;
        setDocked(next);
      }
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(sync);
    };
    sync();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("pageshow", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("pageshow", schedule);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return docked;
}
