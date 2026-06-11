"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Palette, X } from "lucide-react";
import { themes } from "@/lib/themes";
import { useTheme } from "./ThemeProvider";
import { Magnetic } from "./effects/Magnetic";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={panelRef} className="fixed bottom-5 right-5 z-50">
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="menu-panel absolute bottom-16 right-0 w-72 rounded-2xl p-2"
            role="menu"
            aria-label="Choose a theme"
          >
            <p className="px-3 pb-1 pt-2 font-mono text-[10px] uppercase tracking-[0.25em] text-faint">
              Choose a vibe — 7 designs
            </p>
            {themes.map((t) => {
              const active = t.id === theme;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => {
                    setTheme(t.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-surface-2 ${
                    active ? "bg-surface-2" : ""
                  }`}
                >
                  <span className="flex shrink-0 -space-x-1.5">
                    {t.dots.map((c, i) => (
                      <span
                        key={i}
                        className="h-4 w-4 rounded-full border border-[var(--color-border-strong)]"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-fg">
                      {t.name}
                    </span>
                    <span className="block text-xs text-muted">{t.tagline}</span>
                  </span>
                  {active ? <Check className="h-4 w-4 shrink-0 text-iris" /> : null}
                </button>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Magnetic strength={0.5}>
        <motion.button
          type="button"
          onClick={() => setOpen((v) => !v)}
          whileTap={{ scale: 0.92 }}
          data-cursor-label={open ? "" : "Themes"}
          aria-label={open ? "Close theme picker" : "Open theme picker — 7 designs"}
          aria-expanded={open}
          className="glass-strong accent-glow relative grid place-items-center rounded-full text-fg"
          style={{ width: 52, height: 52 }}
        >
          {open ? <X className="h-5 w-5" /> : <Palette className="h-5 w-5" />}
          <span
            className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[var(--color-bg)] bg-gradient-to-br from-iris to-cyan"
            aria-hidden
          />
        </motion.button>
      </Magnetic>
    </div>
  );
}
