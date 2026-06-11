"use client";

import { motion, useReducedMotion } from "motion/react";

type FocusRingProps = {
  size?: number;
  progress?: number; // 0..1
  label?: string;
  caption?: string;
  stroke?: number;
};

export function FocusRing({
  size = 240,
  progress = 0.68,
  label = "24:18",
  caption = "Deep work",
  stroke = 10,
}: FocusRingProps) {
  const reduce = useReducedMotion();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - progress);

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
    >
      {/* Soft glow */}
      <div
        className="absolute inset-0 rounded-full blur-2xl animate-pulse-glow panel-glow"
      />

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="relative -rotate-90"
      >
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "var(--t-grad-1)" }} />
            <stop offset="55%" style={{ stopColor: "var(--t-grad-2)" }} />
            <stop offset="100%" style={{ stopColor: "var(--t-grad-3)" }} />
          </linearGradient>
        </defs>

        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--t-ring-track)"
          strokeWidth={stroke}
        />

        {/* Progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={reduce ? { strokeDashoffset: offset } : { strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: offset }}
          viewport={{ once: true }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: "var(--t-ring-glow)" }}
        />
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div
            className="font-mono font-semibold tracking-tight text-fg"
            style={{ fontSize: size * 0.16 }}
          >
            {label}
          </div>
          <div
            className="mt-1 font-mono uppercase tracking-[0.3em] text-faint"
            style={{ fontSize: Math.max(9, size * 0.045) }}
          >
            {caption}
          </div>
        </div>
      </div>
    </div>
  );
}
