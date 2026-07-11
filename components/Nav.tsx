"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Command, Menu, X } from "lucide-react";
import { navLinks, site } from "@/lib/site";
import { useActiveSection } from "@/lib/useActiveSection";
import { Magnetic } from "./effects/Magnetic";

// "top" sentinel first → no link highlights while still in the hero.
const NAV_IDS = ["top", ...navLinks.map((l) => l.href.replace("#", ""))];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const active = useActiveSection(NAV_IDS, "top");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <motion.nav
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className={`flex w-full max-w-5xl items-center justify-between rounded-2xl border border-transparent px-4 py-2.5 transition-all duration-500 ${
          scrolled
            ? "nav-glass shadow-[0_8px_40px_-16px_rgba(0,0,0,0.35)]"
            : "bg-bg/40 backdrop-blur-md"
        }`}
      >
        <a
          href="#top"
          className="group flex items-center gap-2.5"
          aria-label={`${site.name} — home`}
        >
          <span className="accent-glow grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-iris to-cyan text-sm font-bold tracking-tight text-bg transition-transform duration-300 group-hover:scale-105">
            {site.initials}
          </span>
          <span className="hidden text-sm font-medium tracking-tight text-fg sm:block">
            {site.name}
          </span>
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const isActive = active === link.href.replace("#", "");
            return (
              <a
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive ? "bg-surface text-fg" : "text-muted hover:text-fg"
                }`}
              >
                {link.label}
              </a>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("toggle-cmdk"))}
            data-cursor-label="⌘K"
            aria-label="Open command palette"
            className="hidden items-center gap-1.5 rounded-xl glass px-3 py-2 text-xs text-muted transition-colors hover:text-fg lg:inline-flex"
          >
            <Command className="h-3.5 w-3.5" />
            <span className="font-mono">K</span>
          </button>
          <Magnetic>
            <a
              href="#contact"
              data-cursor-label="Say hi"
              className="hidden items-center gap-1.5 rounded-xl bg-fg px-4 py-2 text-sm font-medium text-bg transition-transform duration-300 hover:scale-[1.03] sm:inline-flex"
            >
              Let’s talk
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </Magnetic>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="grid h-9 w-9 place-items-center rounded-xl glass text-fg md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="menu-panel absolute inset-x-4 top-20 z-50 rounded-2xl p-2 md:hidden"
          >
            {navLinks.map((link) => {
              const isActive = active === link.href.replace("#", "");
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={`block rounded-xl px-4 py-3 text-sm transition-colors ${
                    isActive
                      ? "bg-surface text-fg"
                      : "text-muted hover:bg-surface hover:text-fg"
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
            <a
              href="#contact"
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center justify-center gap-1.5 rounded-xl bg-fg px-4 py-3 text-sm font-medium text-bg"
            >
              Let’s talk
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
