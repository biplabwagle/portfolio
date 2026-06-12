"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Gamepad2,
  X,
} from "lucide-react";

/* ---------------------------------------------------------------------------
   Snake — a themed easter-egg game. Opens from the ⌘K palette, a secret
   "snake" type-code, or the idle "bored?" nudge. Eats the GlassFocus icon.
   All game state lives in refs (React state is frozen inside the RAF loop),
   reads theme colors live, keyboard + swipe controls, reduced-motion aware.
   Responsive: full-screen on mobile, larger centered board on desktop. The
   grid is drawn with PAD inset so edge/corner cells are never clipped.
--------------------------------------------------------------------------- */

const GRID = 21;
const PAD = 14;
const TICK_START = 135;
const TICK_MIN = 66;

type Cell = { x: number; y: number };
type Status = "ready" | "playing" | "over";

function DirPad({
  onDir,
  className,
}: {
  onDir: (d: { x: number; y: number }) => void;
  className?: string;
}) {
  const mk = (
    d: { x: number; y: number },
    label: string,
    Icon: typeof ChevronUp,
    pos: string
  ) => (
    <button
      key={label}
      type="button"
      aria-label={`Move ${label}`}
      onPointerDown={(e) => {
        e.preventDefault();
        onDir(d);
      }}
      className={`pointer-events-auto absolute grid h-12 w-12 place-items-center rounded-2xl glass-strong text-fg transition-transform active:scale-90 ${pos}`}
    >
      <Icon className="h-6 w-6" />
    </button>
  );
  return (
    <div
      data-no-cursor
      className={`pointer-events-auto h-36 w-36 touch-none select-none ${className ?? ""}`}
    >
      {mk({ x: 0, y: -1 }, "up", ChevronUp, "left-1/2 top-0 -translate-x-1/2")}
      {mk({ x: 0, y: 1 }, "down", ChevronDown, "bottom-0 left-1/2 -translate-x-1/2")}
      {mk({ x: -1, y: 0 }, "left", ChevronLeft, "left-0 top-1/2 -translate-y-1/2")}
      {mk({ x: 1, y: 0 }, "right", ChevronRight, "right-0 top-1/2 -translate-y-1/2")}
    </div>
  );
}

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
  const [boardSize, setBoardSize] = useState(300);
  const [pad, setPad] = useState({ show: false, split: false });
  const reduceMotion = useReducedMotion();
  const nudgeRef = useRef(false);
  nudgeRef.current = nudge;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boardWrapRef = useRef<HTMLDivElement>(null);
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
  const cell = useRef(20);
  const sizePx = useRef(380);
  const img = useRef<HTMLImageElement | null>(null);
  const ctl = useRef<{ start: () => void; queueDir: (d: Cell) => void } | null>(
    null
  );

  const openGame = useCallback(() => {
    setNudge(false);
    openRef.current = true;
    setOpen(true);
  }, []);
  const closeGame = useCallback(() => {
    openRef.current = false;
    setOpen(false);
  }, []);

  // Touch controls: show a D-pad on touch devices; split it to the bottom
  // corners (one per thumb) when a phone is held in landscape.
  useEffect(() => {
    const update = () => {
      const touch = window.matchMedia("(pointer: coarse)").matches;
      const split = touch && window.innerWidth > window.innerHeight;
      setPad((p) => (p.show === touch && p.split === split ? p : { show: touch, split }));
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
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

    let buf = "";
    const onType = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el && /^(input|textarea)$/i.test(el.tagName)) return;
      if (e.key.length !== 1) return;
      buf = (buf + e.key.toLowerCase()).slice(-5);
      if (buf === "snake") openGame();
    };
    window.addEventListener("keydown", onType);

    // Idle detection via a polling check + movement thresholds, so spurious
    // zero-delta scroll/mousemove events (Lenis, sticky layers, etc.) don't
    // keep resetting the timer. After ~22s of genuine inactivity, nudge.
    let lastActivity = performance.now();
    let lastShown = -Infinity;
    let lx = -1;
    let ly = -1;
    let lsy = window.scrollY;
    let hide: ReturnType<typeof setTimeout>;
    const bump = () => {
      lastActivity = performance.now();
    };
    const onMove = (e: MouseEvent) => {
      if (Math.abs(e.clientX - lx) > 6 || Math.abs(e.clientY - ly) > 6) {
        lx = e.clientX;
        ly = e.clientY;
        bump();
      }
    };
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - lsy) > 2) {
        lsy = y;
        bump();
      }
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", bump);
    window.addEventListener("pointerdown", bump, { passive: true });
    window.addEventListener("touchstart", bump, { passive: true });
    const check = setInterval(() => {
      if (document.hidden || openRef.current || nudgeRef.current) return;
      const now = performance.now();
      if (now - lastShown < 120000) return; // re-showable, never naggy
      if (now - lastActivity >= 22000) {
        lastShown = now;
        setNudge(true);
        hide = setTimeout(() => setNudge(false), 10000);
      }
    }, 1500);

    return () => {
      window.removeEventListener("open-snake", onOpen);
      window.removeEventListener("keydown", onType);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", bump);
      window.removeEventListener("pointerdown", bump);
      window.removeEventListener("touchstart", bump);
      clearInterval(check);
      clearTimeout(hide);
    };
  }, [openGame]);

  // Game engine — set up while the modal (and its canvas) is open.
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    let iris: number[] = [129, 140, 248];
    let cyan: number[] = [34, 211, 238];
    let accent: number[] = iris;
    let line = "rgba(255,255,255,0.06)";
    const readColors = () => {
      const s = getComputedStyle(document.documentElement);
      iris = hexToRgb(s.getPropertyValue("--color-iris") || "#818cf8");
      cyan = hexToRgb(s.getPropertyValue("--color-cyan") || "#22d3ee");
      accent = iris;
      const fg = hexToRgb(s.getPropertyValue("--color-fg") || "#ededf2");
      line = `rgba(${fg.join(",")},0.07)`;
    };
    readColors();

    const sizeCanvas = () => {
      const mobile = window.innerWidth < 640;
      let avail: number;
      if (mobile && boardWrapRef.current) {
        // Measure the real available area so the board never overflows/clips.
        const r = boardWrapRef.current.getBoundingClientRect();
        avail = Math.max(220, Math.min(r.width, r.height));
      } else {
        avail = Math.min(560, window.innerHeight - 230);
      }
      const c = Math.max(13, Math.floor((avail - PAD * 2) / GRID));
      cell.current = c;
      const px = c * GRID + PAD * 2;
      sizePx.current = px;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(px * dpr);
      canvas.height = Math.round(px * dpr);
      canvas.style.width = px + "px";
      canvas.style.height = px + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      setBoardSize(px);
    };

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
      const c = cell.current;
      const S = sizePx.current;
      const span = GRID * c;
      ctx.clearRect(0, 0, S, S);

      // grid
      ctx.strokeStyle = line;
      ctx.lineWidth = 1;
      for (let i = 0; i <= GRID; i++) {
        const p = Math.round(PAD + i * c) + 0.5;
        ctx.beginPath();
        ctx.moveTo(PAD, p);
        ctx.lineTo(PAD + span, p);
        ctx.moveTo(p, PAD);
        ctx.lineTo(p, PAD + span);
        ctx.stroke();
      }
      // playfield wall
      ctx.strokeStyle = `rgba(${accent.join(",")},0.4)`;
      ctx.lineWidth = 2;
      round(PAD - 3, PAD - 3, span + 6, span + 6, 10);
      ctx.stroke();

      // food (GlassFocus icon)
      const f = food.current;
      const fx = PAD + f.x * c;
      const fy = PAD + f.y * c;
      if (img.current && img.current.complete && img.current.naturalWidth) {
        const pad = c * 0.08;
        ctx.drawImage(img.current, fx + pad, fy + pad, c - pad * 2, c - pad * 2);
      } else {
        ctx.fillStyle = mix(iris, cyan, 0.5);
        round(fx + c * 0.2, fy + c * 0.2, c * 0.6, c * 0.6, 4);
        ctx.fill();
      }

      // snake
      const n = snake.current.length;
      ctx.shadowColor = `rgba(${iris.join(",")},0.5)`;
      ctx.shadowBlur = Math.min(10, c * 0.5);
      const r = Math.max(3, c * 0.28);
      snake.current.forEach((seg, i) => {
        ctx.fillStyle = mix(iris, cyan, n < 2 ? 0 : i / (n - 1));
        const x = PAD + seg.x * c;
        const y = PAD + seg.y * c;
        round(x + 1.5, y + 1.5, c - 3, c - 3, r);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
    };

    const place = () => {
      let p: Cell;
      do {
        p = { x: (Math.random() * GRID) | 0, y: (Math.random() * GRID) | 0 };
      } while (snake.current.some((s) => s.x === p.x && s.y === p.y));
      food.current = p;
    };

    const reset = () => {
      const m = (GRID / 2) | 0;
      snake.current = [
        { x: m, y: m },
        { x: m - 1, y: m },
        { x: m - 2, y: m },
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
      const lastIdx = snake.current.length - 1;
      if (
        nx < 0 ||
        ny < 0 ||
        nx >= GRID ||
        ny >= GRID ||
        snake.current.some((c, i) => i < lastIdx && c.x === nx && c.y === ny)
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
    ctl.current = { start, queueDir };

    sizeCanvas();
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
      if (Math.hypot(dx, dy) < 16) return;
      queueDir(
        Math.abs(dx) > Math.abs(dy)
          ? { x: Math.sign(dx), y: 0 }
          : { x: 0, y: Math.sign(dy) }
      );
    };
    canvas.addEventListener("touchstart", onTS, { passive: true });
    canvas.addEventListener("touchend", onTE, { passive: true });

    const onResize = () => {
      sizeCanvas();
      draw();
    };
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(() => {
      sizeCanvas();
      draw();
    });
    if (boardWrapRef.current) ro.observe(boardWrapRef.current);

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
      window.removeEventListener("resize", onResize);
      ro.disconnect();
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
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="menu-panel fixed bottom-5 left-5 z-[60] flex max-w-[calc(100vw-2.5rem)] items-center gap-3 rounded-2xl px-4 py-3"
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
            className={`fixed inset-0 z-[96] flex justify-center ${
              pad.split ? "" : "sm:items-center sm:p-4"
            }`}
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
              className={`menu-panel relative flex h-full w-full flex-col rounded-none ${
                pad.split
                  ? "p-3"
                  : "p-4 sm:h-auto sm:max-h-[94vh] sm:w-auto sm:rounded-3xl sm:p-5"
              }`}
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
                  <X className="h-5 w-5" />
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
                ref={boardWrapRef}
                className="flex flex-1 items-center justify-center overflow-hidden"
              >
                <div
                  data-no-cursor
                  className="relative overflow-hidden rounded-xl"
                  style={{ width: boardSize, height: boardSize, maxWidth: "100%" }}
                >
                  <canvas ref={canvasRef} className="block touch-none" />
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
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-fg px-5 py-2.5 text-sm font-medium text-bg transition-transform hover:scale-[1.03]"
                          >
                            {status === "over" ? "Play again" : "Start"}
                          </button>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>

              {/* Portrait / tablet: one centered D-pad below the board */}
              {pad.show && !pad.split ? (
                <div className="flex shrink-0 justify-center pt-3">
                  <DirPad
                    onDir={(d) => ctl.current?.queueDir(d)}
                    className="relative"
                  />
                </div>
              ) : null}

              <p className="mt-4 text-center text-xs text-faint">
                {pad.show ? (
                  <span>Use the pad or swipe · tap ✕ to close</span>
                ) : (
                  <>
                    <span className="hidden sm:inline">
                      Arrow keys / WASD to move · Esc to close
                    </span>
                    <span className="sm:hidden">
                      Swipe to move · tap ✕ to close
                    </span>
                  </>
                )}
              </p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Landscape (touch): a D-pad in each bottom corner — one per thumb.
          Rendered at the top level so `fixed` resolves to the viewport rather
          than the transformed modal panel. */}
      {open && pad.show && pad.split ? (
        <>
          <DirPad
            onDir={(d) => ctl.current?.queueDir(d)}
            className="fixed bottom-6 left-6 z-[97] scale-90"
          />
          <DirPad
            onDir={(d) => ctl.current?.queueDir(d)}
            className="fixed bottom-6 right-6 z-[97] scale-90"
          />
        </>
      ) : null}
    </>
  );
}
