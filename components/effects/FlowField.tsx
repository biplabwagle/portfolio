"use client";

import { useEffect, useRef, useState } from "react";

type P = { x: number; y: number; trail: number[]; age: number; max: number; hue: 0 | 1 };

// Per-theme intensity — lighter themes get a much subtler field.
// Dark themes: bright accent trails read well. Light themes: trails must be
// stronger to be visible on a light wash, but capped so dark text stays legible.
const OPACITY: Record<string, number> = {
  glass: 0.7,
  terminal: 0.62,
  noir: 0.58,
  neon: 0.8,
  editorial: 0.42,
  sunset: 0.46,
  brutalist: 0.4,
};

/**
 * A calm, hypnotic flow field: particles drift along an evolving sine-warped
 * vector field, leaving fading trails, and swirl gently around the cursor.
 * Themed (reads accent CSS vars), gated for reduced-motion, fewer particles on
 * small screens. Sits in the fixed background layer, behind all content.
 */
export function FlowField() {
  const [enabled, setEnabled] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useRef({ a: "#818cf8", b: "#22d3ee", opacity: 0.5 });
  const mouse = useRef({ x: -9999, y: -9999, active: false });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const readTheme = () => {
      const s = getComputedStyle(root);
      const theme = root.getAttribute("data-theme") ?? "glass";
      colors.current = {
        a: s.getPropertyValue("--color-iris").trim() || "#818cf8",
        b: s.getPropertyValue("--color-cyan").trim() || "#22d3ee",
        opacity: OPACITY[theme] ?? 0.4,
      };
    };
    readTheme();
    const mo = new MutationObserver(readTheme);
    mo.observe(root, { attributes: true, attributeFilter: ["data-theme"] });

    let W = 0;
    let H = 0;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    let particles: P[] = [];
    const count = () => {
      const target = Math.round((W * H) / 11000);
      return Math.max(34, Math.min(W < 768 ? 54 : 150, target));
    };
    const spawn = (): P => ({
      x: Math.random() * W,
      y: Math.random() * H,
      trail: [],
      age: 0,
      max: 120 + Math.random() * 160,
      hue: Math.random() < 0.5 ? 0 : 1,
    });
    const seed = () => {
      particles = Array.from({ length: count() }, spawn);
    };

    const flowAngle = (x: number, y: number, t: number) => {
      const s = 0.0016;
      let a = Math.sin(x * s + t) + Math.cos(y * s * 1.3 - t * 0.8);
      a += 0.5 * Math.sin((x + y) * s * 0.7 + t * 1.25);
      return a * Math.PI;
    };

    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY, active: true };
    };
    const onLeave = () => (mouse.current.active = false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("resize", resize);
    document.addEventListener("mouseleave", onLeave);

    resize();

    let t = 0;
    let raf = 0;
    const speed = 0.9;
    const tick = () => {
      t += 0.0016;
      ctx.clearRect(0, 0, W, H);
      const { a, b, opacity } = colors.current;
      const m = mouse.current;

      for (const p of particles) {
        let ang = flowAngle(p.x, p.y, t);

        // Cursor swirl + gentle repulsion.
        if (m.active) {
          const dx = p.x - m.x;
          const dy = p.y - m.y;
          const d = Math.hypot(dx, dy);
          const R = 190;
          if (d < R) {
            const f = (R - d) / R;
            ang += f * 2.4; // swirl
            p.x += (dx / (d || 1)) * f * 1.4; // push out
            p.y += (dy / (d || 1)) * f * 1.4;
          }
        }

        p.x += Math.cos(ang) * speed;
        p.y += Math.sin(ang) * speed;
        p.age += 1;

        p.trail.push(p.x, p.y);
        if (p.trail.length > 34) p.trail.splice(0, 2);

        if (
          p.age > p.max ||
          p.x < -40 ||
          p.x > W + 40 ||
          p.y < -40 ||
          p.y > H + 40
        ) {
          Object.assign(p, spawn());
          continue;
        }

        // Draw the tapered, fading trail.
        const pts = p.trail;
        const segs = pts.length / 2 - 1;
        if (segs < 1) continue;
        const color = p.hue === 0 ? a : b;
        for (let i = 0; i < segs; i++) {
          const f = i / segs;
          ctx.globalAlpha = f * f * 0.8 * opacity;
          ctx.strokeStyle = color;
          ctx.lineWidth = 0.7 + f * 1.7;
          ctx.beginPath();
          ctx.moveTo(pts[i * 2], pts[i * 2 + 1]);
          ctx.lineTo(pts[i * 2 + 2], pts[i * 2 + 3]);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      mo.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
      document.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
