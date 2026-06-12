"use client";

import { useEffect, useState } from "react";
import { scrollToHash } from "@/lib/scrollTo";

const SECTIONS = [
  { id: "top", label: "Home" },
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "glassfocus", label: "GlassFocus" },
  { id: "work", label: "Work" },
  { id: "approach", label: "Approach" },
  { id: "contact", label: "Contact" },
];

export function SectionDots() {
  const [active, setActive] = useState("top");

  useEffect(() => {
    let raf = 0;

    const compute = () => {
      raf = 0;
      // The "active" section is the last one whose top has scrolled above a
      // reference line ~35% down the viewport. Height-independent, so tall
      // sections track correctly (unlike intersectionRatio).
      const lineY = window.innerHeight * 0.35;
      let current = SECTIONS[0].id;
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top - lineY <= 0) current = s.id;
      }
      // Snap to the last section once the page is scrolled to the bottom
      // (a short final section may never cross the line otherwise).
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2
      ) {
        current = SECTIONS[SECTIONS.length - 1].id;
      }
      setActive((prev) => (prev === current ? prev : current));
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };

    compute();
    // Native fallback (reduced-motion / no Lenis) + resize.
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    // Lenis drives smooth scroll but does NOT emit native "scroll" events, so
    // subscribe to its own emitter. __lenis is set by SmoothScroll's effect,
    // which may attach slightly after this one — retry briefly until it exists.
    type Lenis = {
      on: (e: string, cb: () => void) => void;
      off: (e: string, cb: () => void) => void;
    };
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
  }, []);

  return (
    <nav
      aria-label="Section navigation"
      className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 lg:flex"
    >
      {SECTIONS.map((s) => {
        const isActive = active === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => scrollToHash(`#${s.id}`)}
            aria-label={`Go to ${s.label}`}
            aria-current={isActive ? "true" : undefined}
            data-cursor-label={s.label}
            className="group relative flex h-4 items-center justify-center"
          >
            <span
              className={`block rounded-full transition-all duration-300 ${
                isActive
                  ? "h-5 w-1.5 bg-gradient-to-b from-iris to-cyan"
                  : "h-1.5 w-1.5 bg-fg/25 group-hover:bg-fg/60"
              }`}
            />
            <span className="pointer-events-none absolute right-5 whitespace-nowrap rounded-md glass px-2 py-1 text-[11px] text-fg opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              {s.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
