"use client";

import { useEffect, useRef, useState } from "react";

type Particle = { x: number; y: number; vx: number; vy: number; life: number; size: number; c: string };
type Ripple = { x: number; y: number; r: number; life: number };

/**
 * Touch counterpart to the desktop Cursor. On coarse-pointer (touch) devices,
 * taps emit a themed ripple + a radial particle burst, and dragging a finger
 * leaves a particle wake. Mounts only when there's no fine pointer and motion
 * is allowed — so it never double-runs alongside the desktop cursor.
 */
export function TouchFX() {
  const [enabled, setEnabled] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const ripples = useRef<Ripple[]>([]);
  const colors = useRef({ a: "#818cf8", b: "#22d3ee" });

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!coarse || reduce) return;
    setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;

    const readColors = () => {
      const s = getComputedStyle(root);
      colors.current = {
        a: s.getPropertyValue("--color-iris").trim() || "#818cf8",
        b: s.getPropertyValue("--color-cyan").trim() || "#22d3ee",
      };
    };
    readColors();
    const mo = new MutationObserver(readColors);
    mo.observe(root, { attributes: true, attributeFilter: ["data-theme"] });

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const burst = (x: number, y: number) => {
      ripples.current.push({ x, y, r: 10, life: 1 });
      for (let i = 0; i < 14; i++) {
        const a = (Math.PI * 2 * i) / 14 + Math.random() * 0.4;
        const sp = 2 + Math.random() * 3.5;
        particles.current.push({
          x,
          y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 1,
          size: 2 + Math.random() * 2.5,
          c: i % 2 ? colors.current.a : colors.current.b,
        });
      }
    };

    const trail = (x: number, y: number) => {
      if (particles.current.length > 110) return;
      particles.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        life: 0.9,
        size: 1.5 + Math.random() * 2,
        c: Math.random() < 0.5 ? colors.current.a : colors.current.b,
      });
    };

    const onStart = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) burst(t.clientX, t.clientY);
    };
    const onMove = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) trail(t.clientX, t.clientY);
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });

    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const ps = particles.current;
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.life -= 0.03;
        if (p.life <= 0) {
          ps.splice(i, 1);
          continue;
        }
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.92;
        p.vy *= 0.92;
        ctx.globalAlpha = p.life * 0.85;
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }

      const rs = ripples.current;
      for (let i = rs.length - 1; i >= 0; i--) {
        const rp = rs[i];
        rp.life -= 0.035;
        if (rp.life <= 0) {
          rs.splice(i, 1);
          continue;
        }
        rp.r += (60 - rp.r) * 0.1 + 2.5;
        ctx.globalAlpha = rp.life * 0.55;
        ctx.strokeStyle = colors.current.a;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      mo.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[95] h-full w-full"
    />
  );
}
