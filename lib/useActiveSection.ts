"use client";

import { useEffect, useState } from "react";

type Lenis = {
  on: (e: string, cb: () => void) => void;
  off: (e: string, cb: () => void) => void;
};

/**
 * Scroll-spy. Returns the id of the section currently in view — the last one
 * whose top has scrolled above a line ~35% down the viewport (height-independent,
 * unlike intersectionRatio, so tall sections track correctly). Subscribes to
 * Lenis (which doesn't emit native scroll events) plus a native fallback.
 *
 * Pass a STABLE `ids` array (module-level constant) so the effect doesn't
 * re-subscribe on every render.
 */
export function useActiveSection(ids: string[], initial = ids[0]) {
  const [active, setActive] = useState(initial);

  useEffect(() => {
    let raf = 0;

    const compute = () => {
      raf = 0;
      const lineY = window.innerHeight * 0.35;
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top - lineY <= 0) current = id;
      }
      // Snap to the last section at the very bottom (a short final section may
      // never cross the line otherwise).
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2
      ) {
        current = ids[ids.length - 1];
      }
      setActive((prev) => (prev === current ? prev : current));
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    const getLenis = () => (window as unknown as { __lenis?: Lenis }).__lenis;
    let retry = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const attachLenis = () => {
      const lenis = getLenis();
      if (lenis?.on) lenis.on("scroll", onScroll);
      else if (retry++ < 50) retryTimer = setTimeout(attachLenis, 100);
    };
    attachLenis();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
      if (retryTimer) clearTimeout(retryTimer);
      getLenis()?.off?.("scroll", onScroll);
    };
  }, [ids]);

  return active;
}
