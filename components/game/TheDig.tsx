"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Mail, Pause, Play, RotateCcw, X } from "lucide-react";
import { site } from "@/lib/site";
import { SandEngine, ARTIFACT_BASE, SAND_BASE } from "./sandEngine";
import {
  DIG_ARTIFACTS,
  DIG_BG,
  ERA_LABELS,
  STRATA_COLORS,
  STRATA_FRACTIONS,
  TOTAL_ARTIFACTS,
  type ArtifactCard,
} from "./digContent";

/* ----------------------------------------------------------------------------
   THE DIG — the portfolio as a falling-sand hourglass. Eight years of career
   strata are buried under sand; the visitor digs (pointer, touch, or keyboard)
   to unearth artifacts, each revealing a real résumé fact as an HTML card.

   Evidence-backed constraints (see deep-research):
   - No fail states, no score, < 5 min — dig at your own pace.
   - Name / role / products / contact are ALWAYS visible as real HTML on top;
     the game only gates depth. Permanent "Skim the résumé" switch.
   - Pause control (WCAG 2.2.2); reduced-motion gets no ambient stream and
     only brief, dig-triggered settling.
   - Canvas 2D cellular automaton — no engine, no WebGL, tiny bundle.
---------------------------------------------------------------------------- */

const MODE_KEY = "bw-mode";
const HEAD_FRAC = 0.16; // headspace above the sand

type Found = Record<string, boolean>;

const setMode = (mode: "dig" | "resume") => {
  document.documentElement.setAttribute("data-mode", mode);
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {}
};

/** Precompute little-endian RGBA pixels for fast ImageData writes. */
const px = (hex: string, alpha = 255) => {
  const n = parseInt(hex.slice(1), 16);
  return ((alpha << 24) | ((n & 0xff) << 16) | (n & 0xff00) | ((n >> 16) & 0xff)) >>> 0;
};
const shade = (hex: string, f: number) => {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) * f));
  const g = Math.min(255, Math.round(((n >> 8) & 255) * f));
  const b = Math.min(255, Math.round((n & 255) * f));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
};

export function TheDig() {
  const [active, setActive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [found, setFound] = useState<Found>({});
  const [card, setCard] = useState<ArtifactCard | null>(null);
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState("");
  const [kbMode, setKbMode] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SandEngine | null>(null);
  const rafRef = useRef(0);
  const pausedRef = useRef(false);
  const doneRef = useRef(false);
  const drainingRef = useRef(false);
  const reduceRef = useRef(false);
  const settleRef = useRef<number>(Infinity); // frames left to simulate (reduce-motion budget)
  const streamBudgetRef = useRef(0); // grains the ambient stream may respawn (≤ dug)
  const cursorRef = useRef({ x: 0.5, y: 0.5, show: false }); // keyboard crosshair (grid fracs)
  const glowRef = useRef<Map<number, number>>(new Map()); // artifact index → glow frames
  const startRef = useRef(0);
  const foundRef = useRef<Found>({});
  const liveRef = useRef<HTMLParagraphElement>(null);

  pausedRef.current = paused;
  doneRef.current = done;
  foundRef.current = found;

  /* Activate when the page loads in dig mode, or when "open-dig" is fired. */
  useEffect(() => {
    const check = () =>
      document.documentElement.getAttribute("data-mode") === "dig" && setActive(true);
    check();
    const onOpen = () => {
      setMode("dig");
      setActive(true);
    };
    window.addEventListener("open-dig", onOpen);
    return () => window.removeEventListener("open-dig", onOpen);
  }, []);

  const leave = useCallback(() => {
    setMode("resume");
    setActive(false);
    (window as unknown as { __lenis?: { start: () => void } }).__lenis?.start();
  }, []);

  /* Engine + render loop. */
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    reduceRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    settleRef.current = reduceRef.current ? 60 : Infinity;
    (window as unknown as { __lenis?: { stop: () => void } }).__lenis?.stop();
    startRef.current = performance.now();

    let cols = 0;
    let rows = 0;
    let cell = 4;
    let img: ImageData;
    let pixels: Uint32Array;
    let palette: Uint32Array[]; // [stratum][jitter]
    let goldA = 0;
    let goldB = 0;
    let buriedPx = 0;
    let bgPx = 0;

    const buildPalette = () => {
      palette = STRATA_COLORS.map((c) => {
        return new Uint32Array([px(shade(c, 0.92)), px(c), px(shade(c, 1.08))]);
      });
      goldA = px("#f2d9a4");
      goldB = px("#fff3d0");
      buriedPx = px("#9a8a6a");
      bgPx = px(DIG_BG);
    };

    const init = (): boolean => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // A zero-sized viewport (background tab, pre-layout mount) would make
      // createImageData throw — report failure so the caller retries.
      if (w < 40 || h < 40) return false;
      cell = Math.max(3, Math.round(Math.min(w, h) / (w < 640 ? 130 : 190)));
      cols = Math.floor(w / cell);
      rows = Math.floor(h / cell);
      canvas.width = cols;
      canvas.height = rows;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const engine = new SandEngine({
        cols,
        rows,
        sandTop: Math.round(rows * HEAD_FRAC),
        strata: STRATA_FRACTIONS,
        artifacts: DIG_ARTIFACTS.map((a) => a.spec),
      });
      // Preserve already-found artifacts across resizes.
      engine.artifacts.forEach((a) => {
        if (foundRef.current[a.id]) a.unearthed = true;
      });
      engineRef.current = engine;
      img = ctx.createImageData(cols, rows);
      pixels = new Uint32Array(img.data.buffer);
      buildPalette();
      return true;
    };

    const render = () => {
      const engine = engineRef.current!;
      const g = engine.grid;
      const glow = glowRef.current;
      for (let i = 0; i < g.length; i++) {
        const c = g[i];
        if (c === 0) {
          pixels[i] = bgPx;
        } else if (c >= ARTIFACT_BASE) {
          const ai = c - ARTIFACT_BASE;
          const a = engine.artifacts[ai];
          const glowing = glow.has(ai) || a?.unearthed;
          pixels[i] = glowing ? (glow.has(ai) && (i & 2) === 0 ? goldB : goldA) : buriedPx;
        } else {
          const s = c - SAND_BASE;
          // 2D hash on (x, y) → organic grain, not a screen-space checkerboard
          const x = i % cols;
          const y = (i / cols) | 0;
          let h = (x * 374761393 + y * 668265263) | 0;
          h = ((h ^ (h >>> 13)) * 1274126177) | 0;
          pixels[i] = palette[Math.min(s, palette.length - 1)][((h >>> 16) & 1023) % 3];
        }
      }
      ctx.putImageData(img, 0, 0);
      // Keyboard crosshair ring
      if (cursorRef.current.show) {
        const { x, y } = cursorRef.current;
        ctx.strokeStyle = "rgba(255,243,208,0.9)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x * cols, y * rows, Math.max(4, 30 / cell), 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    // First frame paints synchronously — the strata are visible even before
    // the RAF loop ticks (and in environments where RAF is throttled).
    // Retries until the viewport has real dimensions (background-tab mounts).
    let ready = false;
    let retryT: ReturnType<typeof setTimeout> | undefined;
    const tryInit = () => {
      if (init()) {
        ready = true;
        render();
      } else {
        retryT = setTimeout(tryInit, 150);
      }
    };
    tryInit();

    let frame = 0;
    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      if (!ready || document.hidden) return;
      const engine = engineRef.current!;
      frame++;

      if (!pausedRef.current && settleRef.current > 0) {
        engine.step();
        if (settleRef.current !== Infinity) settleRef.current--;
        // Ambient stream: only re-pour what the visitor has dug out.
        if (!reduceRef.current && !doneRef.current && streamBudgetRef.current > 0 && frame % 2 === 0) {
          const cx = (cols >> 1) + ((frame >> 1) % 5) - 2;
          const top = engine.grid[cx];
          if (top === 0) {
            engine.grid[cx] = SAND_BASE;
            streamBudgetRef.current--;
          }
        }
      }

      if (drainingRef.current && frame % 2 === 0) {
        const any = engine.drain(2);
        if (!any) {
          drainingRef.current = false;
          setDone(true);
        }
      }

      if (frame % 12 === 0 && !doneRef.current && !drainingRef.current) {
        const fresh = engine.checkUnearthed();
        if (fresh.length) {
          for (const a of fresh) glowRef.current.set(a.index, 90);
          const first = fresh[0];
          const data = DIG_ARTIFACTS[first.index];
          setFound((prev) => {
            const next = { ...prev };
            for (const a of fresh) next[a.id] = true;
            const count = Object.keys(next).length;
            if (liveRef.current) {
              liveRef.current.textContent = `Unearthed: ${data.card.title}. ${count} of ${TOTAL_ARTIFACTS} artifacts found.`;
            }
            if (count === TOTAL_ARTIFACTS) {
              const ms = performance.now() - startRef.current;
              const m = Math.floor(ms / 60000);
              const s = Math.round((ms % 60000) / 1000);
              setElapsed(`${m}:${String(s).padStart(2, "0")}`);
              window.setTimeout(() => {
                setCard(null);
                drainingRef.current = true;
              }, 900);
            }
            return next;
          });
          setCard(data.card);
        }
      }

      for (const [k, v] of glowRef.current) {
        if (v <= 1) glowRef.current.delete(k);
        else glowRef.current.set(k, v - 1);
      }
      render();
    };
    rafRef.current = requestAnimationFrame(loop);

    /* ---- input: pointer digging ---- */
    const digAt = (clientX: number, clientY: number) => {
      if (!ready) return;
      const engine = engineRef.current!;
      const rect = canvas.getBoundingClientRect();
      const gx = Math.round(((clientX - rect.left) / rect.width) * cols);
      const gy = Math.round(((clientY - rect.top) / rect.height) * rows);
      const before = engine.dug;
      engine.dig(gx, gy, Math.max(4, Math.round(30 / cell)));
      streamBudgetRef.current += Math.round((engine.dug - before) * 0.25);
      if (reduceRef.current) settleRef.current = 60;
      render(); // responsive even while paused / RAF-throttled
    };
    let digging = false;
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      digging = true;
      canvas.setPointerCapture?.(e.pointerId);
      digAt(e.clientX, e.clientY);
    };
    const onMove = (e: PointerEvent) => {
      if (digging) digAt(e.clientX, e.clientY);
    };
    const onUp = () => {
      digging = false;
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    /* ---- input: keyboard digging ---- */
    const onKey = (e: KeyboardEvent) => {
      if (document.activeElement !== canvas) return;
      const c = cursorRef.current;
      const stepF = 0.03;
      let used = true;
      switch (e.key) {
        case "ArrowLeft":
          c.x = Math.max(0, c.x - stepF);
          break;
        case "ArrowRight":
          c.x = Math.min(1, c.x + stepF);
          break;
        case "ArrowUp":
          c.y = Math.max(0, c.y - stepF);
          break;
        case "ArrowDown":
          c.y = Math.min(1, c.y + stepF);
          break;
        case " ":
        case "Enter": {
          if (!ready) break;
          const engine = engineRef.current!;
          const before = engine.dug;
          engine.dig(Math.round(c.x * cols), Math.round(c.y * rows), Math.max(4, Math.round(30 / cell)));
          streamBudgetRef.current += Math.round((engine.dug - before) * 0.25);
          if (reduceRef.current) settleRef.current = 60;
          render();
          break;
        }
        default:
          used = false;
      }
      if (used) {
        c.show = true;
        setKbMode(true);
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);

    /* ---- resize (ignore mobile URL-bar jitter) ---- */
    let rw = window.innerWidth;
    let rh = window.innerHeight;
    let rt: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        if (window.innerWidth !== rw || Math.abs(window.innerHeight - rh) > 120) {
          rw = window.innerWidth;
          rh = window.innerHeight;
          if (init()) {
            ready = true;
            render();
          }
        }
      }, 250);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(rt);
      clearTimeout(retryT);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [active]);

  const reset = useCallback(() => {
    setFound({});
    setCard(null);
    setDone(false);
    drainingRef.current = false;
    glowRef.current.clear();
    streamBudgetRef.current = 0;
    setActive(false);
    // remount the engine effect on the next tick
    requestAnimationFrame(() => setActive(true));
  }, []);

  if (!active) return null;

  const foundCount = Object.keys(found).length;
  const sorted = [...DIG_ARTIFACTS]; // already top→bottom

  return (
    <div className="fixed inset-0 z-[110]" style={{ background: DIG_BG }} data-mode-layer>
      <canvas
        ref={canvasRef}
        tabIndex={0}
        role="application"
        aria-label="The Dig: an excavation game. Eight years of career are buried as sand layers. Drag with your pointer, or use arrow keys to aim and space to dig. Every fact is also available in the classic résumé — press the Skim the résumé button to skip the game."
        className="absolute inset-0 touch-none outline-none focus-visible:ring-2 focus-visible:ring-[#f2d9a4]/70"
        style={{ imageRendering: "pixelated" }}
      />

      {/* Era labels along the right edge (real HTML, crawlable) */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-2 hidden sm:block">
        {STRATA_FRACTIONS.map((f, i) => {
          const prev = i === 0 ? 0 : STRATA_FRACTIONS[i - 1];
          const mid = HEAD_FRAC + ((prev + f) / 2) * (1 - HEAD_FRAC);
          return (
            <span
              key={ERA_LABELS[i]}
              className="absolute right-0 -translate-y-1/2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/25"
              style={{ top: `${mid * 100}%` }}
            >
              {ERA_LABELS[i]}
            </span>
          );
        })}
      </div>

      {/* Header — the résumé facts that are NEVER locked behind play */}
      <header className="absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-3 p-4 sm:p-5">
        <div className="max-w-md">
          <h1 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
            {site.name}
          </h1>
          <p className="mt-0.5 text-xs text-white/70 sm:text-sm">{site.role}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <a
              href={site.socials.glassfocus}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-white/80 transition-colors hover:bg-white/10"
            >
              GlassFocus — live
            </a>
            <a
              href={site.socials.toolsdeck}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-white/80 transition-colors hover:bg-white/10"
            >
              ToolsDeck — live
            </a>
            <a
              href={`mailto:${site.email}`}
              className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-white/80 transition-colors hover:bg-white/10"
            >
              <Mail className="h-3 w-3" /> {site.email}
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "Resume the sand" : "Pause the sand"}
            className="grid h-11 w-11 place-items-center rounded-xl border border-white/15 bg-white/5 text-white/80 transition-colors hover:bg-white/10"
          >
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={reset}
            aria-label="Rebury everything and start over"
            className="grid h-11 w-11 place-items-center rounded-xl border border-white/15 bg-white/5 text-white/80 transition-colors hover:bg-white/10"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={leave}
            className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition-transform hover:scale-[1.03]"
          >
            Skim the résumé →
          </button>
        </div>
      </header>

      {/* Timeline rail — one dot per artifact, filled once unearthed */}
      <nav
        aria-label="Unearthed artifacts"
        className="absolute left-3 top-1/2 flex -translate-y-1/2 flex-col gap-2.5"
      >
        {sorted.map((a) => {
          const isFound = !!found[a.card.id];
          return (
            <button
              key={a.card.id}
              type="button"
              disabled={!isFound}
              onClick={() => setCard(a.card)}
              aria-label={isFound ? `Reopen: ${a.card.title}` : "Still buried"}
              className={`h-3 w-3 rounded-full border transition-all ${
                isFound
                  ? "border-[#f2d9a4] bg-[#f2d9a4] shadow-[0_0_8px_rgba(242,217,164,0.7)]"
                  : "border-white/25 bg-transparent"
              }`}
            />
          );
        })}
      </nav>

      {/* Progress + hint */}
      <footer className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/60">
          ⛏ {foundCount}/{TOTAL_ARTIFACTS} unearthed · 8 years buried below
        </p>
        <p className="hidden font-mono text-[11px] text-white/40 sm:block">
          {kbMode ? "arrows aim · space digs" : "drag to dig"}
        </p>
      </footer>
      <p ref={liveRef} aria-live="polite" className="sr-only" />

      {/* Artifact card */}
      {card && !done ? (
        <aside
          role="dialog"
          aria-label={card.title}
          className="absolute bottom-16 left-1/2 w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border border-white/15 bg-[#12131c]/95 p-5 shadow-2xl backdrop-blur-md sm:bottom-auto sm:left-auto sm:right-5 sm:top-1/2 sm:-translate-x-0 sm:-translate-y-1/2"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#f2d9a4]">
              {card.era}
            </span>
            <button
              type="button"
              onClick={() => setCard(null)}
              aria-label="Close"
              className="-m-1 rounded-md p-1 text-white/50 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <h2 className="mt-2 text-lg font-semibold text-white">{card.title}</h2>
          <p className="text-sm text-white/60">{card.subtitle}</p>
          <p className="mt-0.5 font-mono text-[11px] text-white/40">{card.period}</p>
          <ul className="mt-3 space-y-1.5">
            {card.lines.map((l) => (
              <li key={l} className="flex gap-2 text-sm leading-relaxed text-white/80">
                <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-[#f2d9a4]" />
                {l}
              </li>
            ))}
          </ul>
          {card.links ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {card.links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/85 transition-colors hover:bg-white/10"
                >
                  {l.label} <ArrowUpRight className="h-3 w-3" />
                </a>
              ))}
            </div>
          ) : null}
        </aside>
      ) : null}

      {/* Completion */}
      {done ? (
        <div className="absolute inset-0 grid place-items-center p-6">
          <div className="w-[min(28rem,100%)] rounded-3xl border border-white/15 bg-[#12131c]/95 p-8 text-center shadow-2xl backdrop-blur-md">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#f2d9a4]">
              Excavation complete
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              8 years unearthed in {elapsed}.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              You dug this far — imagine what we could build together.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a
                href={`mailto:${site.email}`}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition-transform hover:scale-[1.03]"
              >
                <Mail className="h-4 w-4" /> Let’s talk
              </a>
              <button
                type="button"
                onClick={leave}
                className="rounded-xl border border-white/20 px-5 py-3 text-sm text-white/85 transition-colors hover:bg-white/10"
              >
                Read the full résumé
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-xl border border-white/20 px-5 py-3 text-sm text-white/85 transition-colors hover:bg-white/10"
              >
                Dig again
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
