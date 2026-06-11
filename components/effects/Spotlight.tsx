"use client";

import { useEffect } from "react";

/**
 * One delegated pointer listener that drives the mouse-follow glow on any
 * element with the `.spotlight` class (see globals.css). Cheap: a single
 * listener updates CSS custom properties; the gradient itself is pure CSS.
 */
export function Spotlight() {
  useEffect(() => {
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.(
        ".spotlight"
      ) as HTMLElement | null;
      if (!el) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
