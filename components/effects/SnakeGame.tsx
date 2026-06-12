"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Gamepad2, X } from "lucide-react";

/* ---------------------------------------------------------------------------
   Snake — a themed easter-egg game. Opens from the ⌘K palette, a secret
   "snake" type-code, or the idle "bored?" nudge. Eats the GlassFocus icon.
   All game state lives in refs (React state is frozen inside the RAF loop),
   reads theme colors live, keyboard + swipe controls, reduced-motion aware.
--------------------------------------------------------------------------- */

const CELL = 18;
const GRID = 19;
const BOARD = CELL * GRID;
const TICK_START = 135;
const TICK_MIN = 68;

type Cell = { x: number; y: number };
type Status = "ready" | "playing" | "over";

const hexToRgb = (h: string): [number, number, number] => {
  let s = h.trim().replace("#", "");
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  const n = parseInt(s.slice(0, 6) || "818cf8", 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a: number[], b: number[], t: number) =>
  `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;

export function SnakeGame() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("ready");
  const [score, setScore] = useState(0);
  const [high, setHigh] = useState(0);
  const [nudge, setNudge] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const openRef = useRef(false);

  // Engine state (refs — never read React state inside the RAF loop).
  const snake = useRef<Cell[]>([]);
  const dir = useRef<Cell>({ x: 1, y: 0 });
  const queue = useRef<Cell[]>([]);
  const food = useRef<Cell>({ x: 5, y: 5 });
  const scoreRef = useRef(0);
  const highRef = useRef(0);
  const statusRef = useRef<Status>("ready");
  const tick = useRef(TICK_START);
  const last = useRef(0);
  const raf = useRef(0);
  const img = useRef<HTMLImageElement | null>(null);
  const ctl = useRef<{ start: () => void } | null>(null);

  const openGame = useCallback(() => {
    setNudge(false);
    openRef.current = true;
    setOpen(true);
  }, []);
  const closeGame = useCallback(() => {
    openRef.current = false;
    setOpen(false);
  }, []);

  // Mount: load icon + high score, wire triggers (event, type-code, idle nudge).
  useEffect(() => {
    try {
      highRef.current = Number(localStorage.getItem("bw-snake-hi") || 0);
      setHigh(highRef.current);
    } catch {}
    const i = new Image();
    i.src = "/glassfocus.png";
    img.current = i;

    const onOpen = () => openGame();
    window.addEventListener("open-snake", onOpen);

    // Secret: type "snake" anywhere (not while typing in an input).
    let buf = "";
    const onType = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el && /^(input|textarea)$/i.test(el.tagName)) return;
      if (e.key.length !== 1) return;
      buf = (buf + e.key.toLowerCase()).slice(-5);
      if (buf === "snake") openGame();
    };
    window.addEventListener("keydown", onType);

    // Idle "bored?" nudge — once per session, reduced-motion-safe.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let idle: ReturnType<typeof setTimeout>;
    let hide: ReturnType<typeof setTimeout>;
    const arm = () => {
      clearTimeout(idle);
      if (reduce || document.hidden) return;
      idle = setTimeout(() => {
        try {
          if (sessionStorage.getItem("bw-snake-nudged")) return;
        } catch {}
        if (openRef.current) return;
        setNudge(true);
        try {
          sessionStorage.setItem("bw-snake-nudged", "1");
        } catch {}
        hide = setTimeout(() => setNudge(false), 9000);
      }, 32000);
    };
    const evts = ["mousemove", "keydown", "scroll", "pointerdown", "touchstart"];
    evts.forEach((e) => window.addEventListener(e, arm, { passive: true }));
    document.addEventListener("visibilitychange", arm);
    arm();

    return () => {
      window.removeEventListener("open-snake", onOpen);
      window.removeEventListener("keydown", onType);
      evts.forEach((e) => window.removeEventListener(e, arm));
      document.removeEventListener("visibilitychange", arm);
      clearTimeout(idle);
      clearTimeout(hide);
    };
  }, [openGame]);

  // Game engine — set up while the modal (and its canvas) is open.
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = BOARD * dpr;
    canvas.height = BOARD * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let iris: number[] = [129, 140, 248];
    let cyan: number[] = [34, 211, 238];
    let line = "rgba(255,255,255,0.06)";
    const readColors = () => {
      const s = getComputedStyle(document.documentElement);
      iris = hexToRgb(s.getPropertyValue("--color-iris") || "#818cf8");
      cyan = hexToRgb(s.getPropertyValue("--color-cyan") || "#22d3ee");
      const fg = hexToRgb(s.getPropertyValue("--color-fg") || "#ededf2");
      line = `rgba(${fg.join(",")},0.07)`;
    };
    readColors();

    const round = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    const draw = () => {
      ctx.clearRect(0, 0, BOARD, BOARD);
      // faint grid
      ctx.strokeStyle = line;
      ctx.lineWidth = 1;
      for (let i = 1; i < GRID; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL, 0);
        ctx.lineTo(i * CELL, BOARD);
        ctx.moveTo(0, i * CELL);
        ctx.lineTo(BOARD, i * CELL);
        ctx.stroke();
      }
      // food (GlassFocus icon)
      const f = food.current;
      if (img.current && img.current.complete && img.current.naturalWidth) {
        ctx.drawImage(img.current, f.x * CELL + 1, f.y * CELL + 1, CELL - 2, CELL - 2);
      } else {
        ctx.fillStyle = mix(iris, cyan, 0.5);
        round(f.x * CELL + 4, f.y * CELL + 4, CELL - 8, CELL - 8, 4);
        ctx.fill();
      }
      // snake
      const n = snake.current.length;
      ctx.shadowColor = `rgba(${iris.join(",")},0.55)`;
      ctx.shadowBlur = 8;
      snake.current.forEach((seg, i) => {
        ctx.fillStyle = mix(iris, cyan, n < 2 ? 0 : i / (n - 1));
        round(seg.x * CELL + 1.5, seg.y * CELL + 1.5, CELL - 3, CELL - 3, 5);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
    };

    const place = () => {
      let c: Cell;
      do {
        c = { x: (Math.random() * GRID) | 0, y: (Math.random() * GRID) | 0 };
      } while (snake.current.some((s) => s.x === c.x && s.y === c.y));
      food.current = c;
    };

    const reset = () => {
      snake.current = [
        { x: 9, y: 9 },
        { x: 8, y: 9 },
        { x: 7, y: 9 },
      ];
      dir.current = { x: 1, y: 0 };
      queue.current = [];
      scoreRef.current = 0;
      setScore(0);
      tick.current = TICK_START;
      place();
    };

    const over = () => {
      statusRef.current = "over";
      setStatus("over");
      if (scoreRef.current > highRef.current) {
        highRef.current = scoreRef.current;
        setHigh(scoreRef.current);
        try {
          localStorage.setItem("bw-snake-hi", String(scoreRef.current));
        } catch {}
      }
      draw();
    };

    const step = () => {
      if (queue.current.length) {
        const nd = queue.current.shift()!;
        if (nd.x !== -dir.current.x || nd.y !== -dir.current.y) dir.current = nd;
      }
      const head = snake.current[0];
      const nx = head.x + dir.current.x;
      const ny = head.y + dir.current.y;
      const last2 = snake.current.length - 1;
      if (
        nx < 0 ||
        ny < 0 ||
        nx >= GRID ||
        ny >= GRID ||
        snake.current.some((c, i) => i < last2 && c.x === nx && c.y === ny)
      ) {
        over();
        return;
      }
      snake.current.unshift({ x: nx, y: ny });
      if (nx === food.current.x && ny === food.current.y) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
        tick.current = Math.max(TICK_MIN, TICK_START - scoreRef.current * 3);
        place();
      } else {
        snake.current.pop();
      }
      draw();
    };

    const loop = (now: number) => {
      raf.current = requestAnimationFrame(loop);
      if (statusRef.current !== "playing" || document.hidden) {
        last.current = now;
        return;
      }
      if (now - last.current < tick.current) return;
      last.current = now;
      step();
    };

    const start = () => {
      reset();
      statusRef.current = "playing";
      setStatus("playing");
      last.current = performance.now();
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(loop);
    };
    ctl.current = { start };

    const queueDir = (nd: Cell) => {
      if (statusRef.current === "ready") start();
      const cur = queue.current.length
        ? queue.current[queue.current.length - 1]
        : dir.current;
      if (
        (nd.x !== -cur.x || nd.y !== -cur.y) &&
        !(nd.x === cur.x && nd.y === cur.y) &&
        queue.current.length < 2
      )
        queue.current.push(nd);
    };

    statusRef.current = "ready";
    setStatus("ready");
    reset();
    draw();

    const KEYS: Record<string, Cell> = {
      arrowup: { x: 0, y: -1 },
      w: { x: 0, y: -1 },
      arrowdown: { x: 0, y: 1 },
      s: { x: 0, y: 1 },
      arrowleft: { x: -1, y: 0 },
      a: { x: -1, y: 0 },
      arrowright: { x: 1, y: 0 },
      d: { x: 1, y: 0 },
    };
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "escape") return closeGame();
      if (KEYS[k]) {
        e.preventDefault();
        queueDir(KEYS[k]);
      } else if (k === " " || k === "enter") {
        e.preventDefault();
        if (statusRef.current !== "playing") start();
      }
    };
    window.addEventListener("keydown", onKey);

    let ts: { x: number; y: number } | null = null;
    const onTS = (e: TouchEvent) => {
      ts = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTE = (e: TouchEvent) => {
      if (!ts) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - ts.x;
      const dy = t.clientY - ts.y;
      ts = null;
      if (Math.hypot(dx, dy) < 14) return;
      queueDir(
        Math.abs(dx) > Math.abs(dy)
          ? { x: Math.sign(dx), y: 0 }
          : { x: 0, y: Math.sign(dy) }
      );
    };
    canvas.addEventListener("touchstart", onTS, { passive: true });
    canvas.addEventListener("touchend", onTE, { passive: true });

    const mo = new MutationObserver(() => {
      readColors();
      draw();
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    try {
      (window as unknown as { __lenis?: { stop: () => void } }).__lenis?.stop();
    } catch {}
    document.body.style.overflow = "hidden";

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("keydown", onKey);
      canvas.removeEventListener("touchstart", onTS);
      canvas.removeEventListener("touchend", onTE);
      mo.disconnect();
      try {
        (window as unknown as { __lenis?: { start: () => void } }).__lenis?.start();
      } catch {}
      document.body.style.removeProperty("overflow");
    };
  }, [open, closeGame]);

  return (
    <>
      {/* Idle "bored?" nudge */}
      <AnimatePresence>
        {nudge && !open ? (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="menu-panel fixed bottom-5 left-5 z-[60] flex items-center gap-3 rounded-2xl px-4 py-3"
          >
            <span className="text-lg">🐍</span>
            <button
              type="button"
              onClick={openGame}
              data-cursor-label="Play"
              className="text-left text-sm"
            >
              <span className="block font-medium text-fg">Bored? Play Snake</span>
              <span className="block text-xs text-muted">
                Feed the hourglass — your high: {high}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setNudge(false)}
              aria-label="Dismiss"
              className="ml-1 rounded-md p-1 text-faint hover:text-fg"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Game modal */}
      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[96] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/55 backdrop-blur-sm"
              onClick={closeGame}
              aria-hidden
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Snake game"
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="menu-panel relative w-full max-w-[380px] rounded-3xl p-5"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="h-4 w-4 text-iris" />
                  <span className="font-mono text-xs uppercase tracking-[0.25em] text-faint">
                    Snake
                  </span>
                </div>
                <button
                  type="button"
                  onClick={closeGame}
                  aria-label="Close"
                  className="rounded-lg p-1 text-faint hover:text-fg"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-muted">
                  Score <span className="font-semibold text-fg">{score}</span>
                </span>
                <span className="text-muted">
                  Best <span className="font-semibold text-fg">{high}</span>
                </span>
              </div>

              <div
                className="relative mx-auto overflow-hidden rounded-2xl border border-[var(--color-border)]"
                style={{ width: BOARD, height: BOARD, maxWidth: "100%" }}
              >
                <canvas
                  ref={canvasRef}
                  className="block h-full w-full touch-none"
                  style={{ width: BOARD, height: BOARD }}
                />
                <AnimatePresence>
                  {status !== "playing" ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 grid place-items-center bg-bg/55 backdrop-blur-[2px]"
                    >
                      <div className="text-center">
                        {status === "over" ? (
                          <>
                            <p className="text-lg font-semibold text-fg">
                              Game over
                            </p>
                            <p className="mt-1 text-sm text-muted">
                              You fed {score} hourglass{score === 1 ? "" : "es"}.
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-muted">
                            Eat the GlassFocus hourglass.
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => ctl.current?.start()}
                          data-cursor-label="Go"
                          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-fg px-4 py-2 text-sm font-medium text-bg transition-transform hover:scale-[1.03]"
                        >
                          {status === "over" ? "Play again" : "Start"}
                        </button>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              <p className="mt-4 text-center text-xs text-faint">
                <span className="hidden sm:inline">
                  Arrow keys / WASD to move · Esc to close
                </span>
                <span className="sm:hidden">Swipe to move</span>
              </p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
