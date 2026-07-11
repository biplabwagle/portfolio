"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpRight,
  CornerDownLeft,
  Dices,
  ExternalLink,
  Hash,
  Palette,
  Search,
} from "lucide-react";
import { navLinks, site } from "@/lib/site";
import { themes, THEME_IDS, type ThemeId } from "@/lib/themes";
import { useTheme } from "../ThemeProvider";
import { scrollToHash } from "@/lib/scrollTo";

type Cmd = {
  id: string;
  label: string;
  group: "Navigate" | "Theme" | "Links" | "Fun";
  hint?: string;
  keywords?: string;
  perform: () => void;
};

export function CommandPalette() {
  const { setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const go = (href: string) => () => {
    setOpen(false);
    requestAnimationFrame(() => scrollToHash(href));
  };
  const link = (url: string) => () => {
    setOpen(false);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const commands = useMemo<Cmd[]>(() => {
    const nav: Cmd[] = [
      { id: "nav-top", label: "Go to Top", group: "Navigate", keywords: "home hero", perform: go("#top") },
      ...navLinks.map((l) => ({
        id: `nav-${l.href}`,
        label: `Go to ${l.label}`,
        group: "Navigate" as const,
        perform: go(l.href),
      })),
    ];
    const theme: Cmd[] = themes.map((t) => ({
      id: `theme-${t.id}`,
      label: `Theme — ${t.name}`,
      group: "Theme",
      hint: t.tagline,
      keywords: `${t.tagline} skin color`,
      perform: () => {
        setTheme(t.id);
        setOpen(false);
      },
    }));
    const links: Cmd[] = [
      { id: "l-gf", label: "Open GlassFocus", group: "Links", keywords: "app product", perform: link(site.socials.glassfocus) },
      { id: "l-td", label: "Open ToolsDeck", group: "Links", keywords: "tools utilities web app product", perform: link(site.socials.toolsdeck) },
      { id: "l-as", label: "Open on the App Store", group: "Links", keywords: "ios iphone ipad glassfocus", perform: link(site.socials.appstore) },
      { id: "l-gp", label: "Open on Google Play", group: "Links", keywords: "android google play glassfocus", perform: link(site.socials.googleplay) },
      { id: "l-x", label: "Open X / Twitter", group: "Links", keywords: "social bipz17", perform: link(site.socials.twitter) },
      { id: "l-gh", label: "Open GitHub", group: "Links", keywords: "social code repo", perform: link(site.socials.github) },
      { id: "l-li", label: "Open LinkedIn", group: "Links", keywords: "social work", perform: link(site.socials.linkedin) },
      {
        id: "l-mail",
        label: `Email ${site.email}`,
        group: "Links",
        keywords: "contact hire",
        perform: () => {
          setOpen(false);
          window.location.href = `mailto:${site.email}`;
        },
      },
    ];
    const fun: Cmd[] = [
      {
        id: "fun-breaker",
        label: "Play Monolith Breaker 🗡️",
        group: "Fun",
        keywords: "game slice blade arcade monolith breaker play career",
        perform: () => {
          setOpen(false);
          window.location.href = "/breaker";
        },
      },
      {
        id: "fun-snake",
        label: "Play Snake 🐍",
        group: "Fun",
        keywords: "game bored play arcade hourglass",
        perform: () => {
          setOpen(false);
          window.dispatchEvent(new Event("open-snake"));
        },
      },
      {
        id: "fun-random",
        label: "Surprise me — random theme",
        group: "Fun",
        keywords: "shuffle dice",
        perform: () => {
          const next = THEME_IDS[Math.floor(Math.random() * THEME_IDS.length)] as ThemeId;
          setTheme(next);
          setOpen(false);
        },
      },
    ];
    return [...nav, ...theme, ...links, ...fun];
  }, [setTheme]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) =>
      `${c.label} ${c.group} ${c.keywords ?? ""}`.toLowerCase().includes(q)
    );
  }, [commands, query]);

  // Toggle on ⌘K / Ctrl+K, and via custom event from the nav hint.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onToggle = () => setOpen((v) => !v);
    window.addEventListener("keydown", onKey);
    window.addEventListener("toggle-cmdk", onToggle);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("toggle-cmdk", onToggle);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
    // Lock the page while the palette is open — otherwise Lenis keeps eating
    // wheel events and scrolls the page behind the dialog.
    type LenisCtl = { stop: () => void; start: () => void };
    const lenis = (window as unknown as { __lenis?: LenisCtl }).__lenis;
    if (open) {
      try {
        lenis?.stop();
      } catch {}
      document.body.style.overflow = "hidden";
      return () => {
        try {
          lenis?.start();
        } catch {}
        document.body.style.removeProperty("overflow");
      };
    }
  }, [open]);

  useEffect(() => setActive(0), [query]);

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      filtered[active]?.perform();
    }
  };

  // Keep the active row in view.
  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    node?.scrollIntoView({ block: "nearest" });
  }, [active]);

  let runningIndex = -1;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[90] flex items-start justify-center p-4 pt-[14vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onKeyDown={onListKey}
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            className="menu-panel relative w-full max-w-xl overflow-hidden rounded-2xl"
          >
            <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4">
              <Search className="h-4 w-4 shrink-0 text-faint" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Jump to a section, switch themes, open links…"
                className="w-full bg-transparent py-4 text-sm text-fg outline-none placeholder:text-faint"
              />
              <kbd className="hidden shrink-0 rounded-md border border-[var(--color-border)] bg-surface px-1.5 py-0.5 font-mono text-[10px] text-faint sm:block">
                ESC
              </kbd>
            </div>

            <div
              ref={listRef}
              data-lenis-prevent
              className="max-h-[52vh] overflow-y-auto overscroll-contain p-2"
            >
              {filtered.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-faint">
                  No matches for “{query}”.
                </p>
              ) : (
                (["Navigate", "Theme", "Links", "Fun"] as const).map((group) => {
                  const items = filtered.filter((c) => c.group === group);
                  if (!items.length) return null;
                  return (
                    <div key={group} className="mb-1">
                      <p className="px-3 pb-1 pt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
                        {group}
                      </p>
                      {items.map((c) => {
                        runningIndex += 1;
                        const idx = runningIndex;
                        const isActive = idx === active;
                        const Icon =
                          group === "Theme"
                            ? Palette
                            : group === "Links"
                              ? ExternalLink
                              : group === "Fun"
                                ? Dices
                                : Hash;
                        return (
                          <button
                            key={c.id}
                            data-idx={idx}
                            type="button"
                            onMouseMove={() => setActive(idx)}
                            onClick={c.perform}
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                              isActive ? "bg-surface-2" : ""
                            }`}
                          >
                            <Icon className="h-4 w-4 shrink-0 text-iris" />
                            <span className="flex-1 text-sm text-fg">{c.label}</span>
                            {c.hint ? (
                              <span className="text-xs text-faint">{c.hint}</span>
                            ) : null}
                            {group === "Links" ? (
                              <ArrowUpRight className="h-3.5 w-3.5 text-faint" />
                            ) : null}
                            {isActive ? (
                              <CornerDownLeft className="h-3.5 w-3.5 text-faint" />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
