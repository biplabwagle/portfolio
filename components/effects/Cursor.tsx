"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import { useInteractive } from "@/lib/useInteractive";

type Variant = "default" | "hover" | "down";
type Particle = { x: number; y: number; vx: number; vy: number; life: number; size: number; c: string };
type Ripple = { x: number; y: number; r: number; life: number };

export function Cursor() {
  const interactive = useInteractive();
  const [visible, setVisible] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [variant, setVariant] = useState<Variant>("default");
  const [label, setLabel] = useState("");

  // Instant pointer position (dot); spring-lagged (ring/label).
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 380, damping: 30, mass: 0.5 });
  const ringY = useSpring(y, { stiffness: 380, damping: 30, mass: 0.5 });
  // Velocity-driven deformation.
  const rot = useMotionValue(0);
  const sx = useMotionValue(1);
  const sy = useMotionValue(1);
  const dotScale = useMotionValue(1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const ripples = useRef<Ripple[]>([]);
  const colors = useRef({ a: "#818cf8", b: "#22d3ee" });
  const prev = useRef({ x: -100, y: -100 });
  const stretch = useRef(0);
  const acc = useRef(0);

  const visibleRef = useRef(false);
  const hiddenRef = useRef(false);
  const variantRef = useRef<Variant>("default");
  const labelRef = useRef("");
  variantRef.current = variant;
  labelRef.current = label;
  hiddenRef.current = hidden;

  useEffect(() => {
    if (!interactive) return;
    const root = document.documentElement;
    root.classList.add("custom-cursor");

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

    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      if (!visibleRef.current) {
        setVisible(true);
        visibleRef.current = true;
      }
      // Hide the cursor entirely over opted-out areas (e.g. the Snake board).
      const noCursor = (e.target as Element | null)?.closest?.("[data-no-cursor]");
      if (!!noCursor !== hiddenRef.current) setHidden(!!noCursor);

      const el = (e.target as Element | null)?.closest?.(
        "a, button, [role='button'], [data-cursor], input, textarea, select, label"
      ) as HTMLElement | null;
      if (el) {
        const l = el.getAttribute("data-cursor-label") ?? "";
        if (labelRef.current !== l) setLabel(l);
        if (variantRef.current !== "hover") setVariant("hover");
      } else {
        if (labelRef.current !== "") setLabel("");
        if (variantRef.current !== "default") setVariant("default");
      }
    };
    const onDown = (e: MouseEvent) => {
      ripples.current.push({ x: e.clientX, y: e.clientY, r: 8, life: 1 });
      if (variantRef.current !== "hover") setVariant("down");
    };
    const onUp = () => {
      if (variantRef.current === "down") setVariant("default");
    };
    const onLeave = () => {
      setVisible(false);
      visibleRef.current = false;
    };
    const onEnter = () => {
      setVisible(true);
      visibleRef.current = true;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    let raf = 0;
    const tick = () => {
      const px = x.get();
      const py = y.get();
      const dx = px - prev.current.x;
      const dy = py - prev.current.y;
      const speed = Math.hypot(dx, dy);

      // Squash & stretch the ring along the velocity vector.
      const target = Math.min(speed / 26, 0.55);
      stretch.current += (target - stretch.current) * 0.2;
      if (speed > 0.8) rot.set((Math.atan2(dy, dx) * 180) / Math.PI);
      sx.set(1 + stretch.current);
      sy.set(1 - stretch.current * 0.65);
      dotScale.set(1 + Math.min(speed / 40, 0.7));

      // Emit a particle wake along the path (paused while showing a label).
      acc.current += speed;
      if (labelRef.current === "") {
        const spacing = 7;
        while (acc.current > spacing && particles.current.length < 90) {
          acc.current -= spacing;
          particles.current.push({
            x: px,
            y: py,
            vx: dx * 0.12 + (Math.random() - 0.5) * 0.8,
            vy: dy * 0.12 + (Math.random() - 0.5) * 0.8,
            life: 1,
            size: 1.5 + Math.random() * 2.5,
            c: Math.random() < 0.5 ? colors.current.a : colors.current.b,
          });
        }
      } else {
        acc.current = 0;
      }

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const ps = particles.current;
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.life -= 0.045;
        if (p.life <= 0) {
          ps.splice(i, 1);
          continue;
        }
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.9;
        p.vy *= 0.9;
        ctx.globalAlpha = p.life * 0.8;
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }

      const rs = ripples.current;
      for (let i = rs.length - 1; i >= 0; i--) {
        const rp = rs[i];
        rp.life -= 0.04;
        if (rp.life <= 0) {
          rs.splice(i, 1);
          continue;
        }
        rp.r += (44 - rp.r) * 0.12 + 2;
        ctx.globalAlpha = rp.life * 0.5;
        ctx.strokeStyle = colors.current.a;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      prev.current.x = px;
      prev.current.y = py;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      root.classList.remove("custom-cursor");
      mo.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive]);

  if (!interactive) return null;

  const ringSize = variant === "hover" ? 54 : variant === "down" ? 24 : 32;
  const hasLabel = variant === "hover" && label.length > 0;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100]"
      style={{ opacity: visible && !hidden ? 1 : 0, transition: "opacity 0.2s" }}
      aria-hidden
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Comet-head dot */}
      <motion.div
        className="absolute left-0 top-0 rounded-full bg-iris"
        style={{
          x,
          y,
          width: 6,
          height: 6,
          scale: dotScale,
          translateX: "-50%",
          translateY: "-50%",
          opacity: hasLabel ? 0 : 1,
        }}
      />

      {/* Velocity-stretched ring (rotate on wrapper, scale on inner) */}
      <motion.div
        className="absolute left-0 top-0"
        style={{ x: ringX, y: ringY, rotate: rot, translateX: "-50%", translateY: "-50%" }}
      >
        <motion.div
          className="rounded-full border border-iris/70"
          style={{ scaleX: sx, scaleY: sy }}
          animate={{
            width: hasLabel ? 0 : ringSize,
            height: hasLabel ? 0 : ringSize,
            opacity: hasLabel ? 0 : variant === "hover" ? 1 : 0.8,
            backgroundColor:
              variant === "hover"
                ? "color-mix(in srgb, var(--color-iris) 14%, transparent)"
                : "rgba(0,0,0,0)",
          }}
          transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.5 }}
        />
      </motion.div>

      {/* Context label */}
      <AnimatePresence>
        {hasLabel ? (
          <motion.div
            key="label"
            className="absolute left-0 top-0 whitespace-nowrap rounded-full bg-iris px-3 py-1.5 text-[11px] font-semibold text-bg"
            style={{ x: ringX, y: ringY, translateX: "-50%", translateY: "-50%" }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            {label}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
