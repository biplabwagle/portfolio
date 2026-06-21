"use client";

import { scrollToHash } from "@/lib/scrollTo";
import { useActiveSection } from "@/lib/useActiveSection";

const SECTIONS = [
  { id: "top", label: "Home" },
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "glassfocus", label: "GlassFocus" },
  { id: "work", label: "Work" },
  { id: "approach", label: "Approach" },
  { id: "contact", label: "Contact" },
];
const SECTION_IDS = SECTIONS.map((s) => s.id);

export function SectionDots() {
  const active = useActiveSection(SECTION_IDS, "top");

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
