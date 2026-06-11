"use client";

import { useEffect, useRef, useState } from "react";
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
  const ratios = useRef<Record<string, number>>({});

  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      Boolean
    ) as HTMLElement[];
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          ratios.current[e.target.id] = e.isIntersecting ? e.intersectionRatio : 0;
        }
        let best = "top";
        let bestR = -1;
        for (const id in ratios.current) {
          if (ratios.current[id] > bestR) {
            bestR = ratios.current[id];
            best = id;
          }
        }
        setActive(best);
      },
      { threshold: [0.15, 0.4, 0.7], rootMargin: "-40% 0px -40% 0px" }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
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
            className="group relative flex items-center justify-center"
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
