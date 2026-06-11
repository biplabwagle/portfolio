"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Gamepad2 } from "lucide-react";
import { useTheme } from "../ThemeProvider";

const SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

const COLORS = ["#ff2da0", "#00e5ff", "#b537f2", "#818cf8", "#22d3ee", "#ffd60a"];

function burstConfetti() {
  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:120";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);
  const W = window.innerWidth;
  const H = window.innerHeight;

  const N = 160;
  const parts = Array.from({ length: N }, (_, i) => ({
    x: W / 2,
    y: H / 2,
    vx: (Math.sin(i) + (i % 7) / 7 - 0.5) * 14,
    vy: (Math.cos(i) - 1.2) * 12 - 4,
    size: 5 + (i % 5),
    rot: i,
    vr: (i % 2 ? 1 : -1) * (0.2 + (i % 5) / 10),
    color: COLORS[i % COLORS.length],
  }));

  let life = 0;
  const gravity = 0.42;
  const tick = () => {
    life += 1;
    ctx.clearRect(0, 0, W, H);
    parts.forEach((p) => {
      p.vy += gravity;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, 1 - life / 130);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });
    if (life < 130) {
      requestAnimationFrame(tick);
    } else {
      canvas.remove();
    }
  };
  requestAnimationFrame(tick);
}

export function Konami() {
  const { setTheme } = useTheme();
  const [toast, setToast] = useState(false);

  useEffect(() => {
    let idx = 0;
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === SEQUENCE[idx]) {
        idx += 1;
        if (idx === SEQUENCE.length) {
          idx = 0;
          if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            burstConfetti();
          }
          setTheme("neon");
          setToast(true);
          window.setTimeout(() => setToast(false), 4000);
        }
      } else {
        idx = key === SEQUENCE[0] ? 1 : 0;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setTheme]);

  return (
    <AnimatePresence>
      {toast ? (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className="menu-panel fixed bottom-24 left-1/2 z-[121] flex -translate-x-1/2 items-center gap-3 rounded-full px-5 py-3"
        >
          <Gamepad2 className="h-5 w-5 text-iris" />
          <span className="text-sm font-medium text-fg">
            Konami unlocked — Cyberwave engaged.
          </span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
