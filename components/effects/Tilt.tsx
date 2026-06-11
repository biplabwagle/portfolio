"use client";

import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useInteractive } from "@/lib/useInteractive";

type TiltProps = {
  children: ReactNode;
  className?: string;
  max?: number; // max rotation in degrees
  glare?: boolean;
};

/**
 * Subtle 3D pointer-tilt with optional moving glare. Gated to fine-pointer +
 * motion-allowed; renders a plain wrapper otherwise.
 */
export function Tilt({ children, className, max = 9, glare = true }: TiltProps) {
  const interactive = useInteractive();
  const ref = useRef<HTMLDivElement>(null);

  // All hooks must run unconditionally, before any early return.
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [max, -max]), {
    stiffness: 200,
    damping: 20,
  });
  const ry = useSpring(useTransform(px, [0, 1], [-max, max]), {
    stiffness: 200,
    damping: 20,
  });
  const glareBg = useTransform([px, py], ([x, y]) => {
    const gx = (x as number) * 100;
    const gy = (y as number) * 100;
    return `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.55), transparent 55%)`;
  });

  if (!interactive) {
    return <div className={className}>{children}</div>;
  }

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };

  const reset = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
      className={`relative [perspective:1000px] ${className ?? ""}`}
    >
      {children}
      {glare ? (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-40 mix-blend-soft-light"
          style={{ background: glareBg }}
        />
      ) : null}
    </motion.div>
  );
}
