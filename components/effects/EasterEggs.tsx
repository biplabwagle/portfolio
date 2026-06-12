"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PartyPopper, Rocket, Sparkles } from "lucide-react";
import { scrollToHash } from "@/lib/scrollTo";

/* ---------------------------------------------------------------------------
   Easter eggs beyond Konami/snake:
   - Styled console banner + callable console API: snake(), party(), hire()
   - Type "party" → themed confetti rain · type "hire" → glide to contact
   - Click the BW logo 5× fast → the whole page does a barrel roll
   All reduced-motion aware; toasts announce what was found.
--------------------------------------------------------------------------- */

const COLORS = ["#ff2da0", "#00e5ff", "#b537f2", "#818cf8", "#22d3ee", "#ffd60a"];

function confettiRain(durationMs = 4500) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:130";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas.remove();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  ctx.scale(dpr, dpr);

  type P = { x: number; y: number; vy: number; vx: number; rot: number; vr: number; w: number; h: number; c: string };
  const parts: P[] = Array.from({ length: 110 }, (_, i) => ({
    x: Math.random() * innerWidth,
    y: -20 - Math.random() * innerHeight * 0.5,
    vy: 2.2 + Math.random() * 3,
    vx: (Math.random() - 0.5) * 1.6,
    rot: Math.random() * 6.3,
    vr: (Math.random() - 0.5) * 0.25,
    w: 6 + Math.random() * 5,
    h: 4 + Math.random() * 4,
    c: COLORS[i % COLORS.length],
  }));

  const t0 = performance.now();
  const tick = (now: number) => {
    const elapsed = now - t0;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    const fade = elapsed > durationMs ? Math.max(0, 1 - (elapsed - durationMs) / 800) : 1;
    for (const p of parts) {
      p.y += p.vy;
      p.x += p.vx + Math.sin(p.y / 40) * 0.6;
      p.rot += p.vr;
      if (p.y > innerHeight + 20 && elapsed < durationMs) {
        p.y = -20;
        p.x = Math.random() * innerWidth;
      }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = 0.9 * fade;
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (fade > 0) requestAnimationFrame(tick);
    else canvas.remove();
  };
  requestAnimationFrame(tick);
}

type Toast = { icon: "party" | "rocket" | "sparkles"; text: string } | null;

export function EasterEggs() {
  const [toast, setToast] = useState<Toast>(null);

  const announce = useCallback((t: Exclude<Toast, null>) => {
    setToast(t);
    window.setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    // --- Console banner + API (the classic dev-tools egg) ---
    try {
      const css = "background:linear-gradient(110deg,#818cf8,#22d3ee);color:#06060d;font-weight:700;padding:6px 12px;border-radius:8px;font-size:13px";
      console.log("%c👋 Hey, fellow dev — welcome to waglegroup.com", css);
      console.log(
        "%cTry these in this console:\n  snake()  → play the hidden game\n  party()  → it rains confetti\n  hire()   → you know what this does 😉\n\n…or on the page: type “snake”, type “party”, try ↑↑↓↓←→←→BA, click my logo 5×.",
        "color:#818cf8;font-size:12px;line-height:1.7"
      );
      const w = window as unknown as Record<string, unknown>;
      w.snake = () => {
        window.dispatchEvent(new Event("open-snake"));
        return "🐍 Have fun!";
      };
      w.party = () => {
        confettiRain();
        return "🎉";
      };
      w.hire = () => {
        scrollToHash("#contact");
        confettiRain(2500);
        return "📬 biplabwagle@gmail.com — talk soon!";
      };
    } catch {}

    // --- Typed sequences: "party", "hire" ---
    let buf = "";
    const onType = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el && /^(input|textarea)$/i.test(el.tagName)) return;
      if (e.key.length !== 1) return;
      buf = (buf + e.key.toLowerCase()).slice(-6);
      if (buf.endsWith("party")) {
        confettiRain();
        announce({ icon: "party", text: "Party mode! You found a secret." });
      } else if (buf.endsWith("hire")) {
        scrollToHash("#contact");
        confettiRain(2500);
        announce({ icon: "rocket", text: "Excellent choice — let’s talk!" });
      }
    };
    window.addEventListener("keydown", onType);

    // --- Logo rapid-clicks → barrel roll ---
    let clicks = 0;
    let firstClick = 0;
    const onClick = (e: MouseEvent) => {
      const logo = (e.target as Element | null)?.closest?.('a[aria-label$="home"]');
      if (!logo) return;
      const now = performance.now();
      if (now - firstClick > 3000) {
        clicks = 0;
        firstClick = now;
      }
      clicks += 1;
      if (clicks >= 5) {
        clicks = 0;
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          document.body.classList.remove("barrel-roll");
          // restart the animation if it was just played
          void document.body.offsetWidth;
          document.body.classList.add("barrel-roll");
          window.setTimeout(() => document.body.classList.remove("barrel-roll"), 1400);
        }
        confettiRain(2000);
        announce({ icon: "sparkles", text: "Do a barrel roll! 🛸" });
      }
    };
    window.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("keydown", onType);
      window.removeEventListener("click", onClick);
    };
  }, [announce]);

  return (
    <AnimatePresence>
      {toast ? (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className="menu-panel fixed bottom-24 left-1/2 z-[131] flex -translate-x-1/2 items-center gap-3 rounded-full px-5 py-3"
        >
          {toast.icon === "party" ? (
            <PartyPopper className="h-5 w-5 text-iris" />
          ) : toast.icon === "rocket" ? (
            <Rocket className="h-5 w-5 text-iris" />
          ) : (
            <Sparkles className="h-5 w-5 text-iris" />
          )}
          <span className="whitespace-nowrap text-sm font-medium text-fg">
            {toast.text}
          </span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
