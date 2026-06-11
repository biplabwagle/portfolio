"use client";

import { useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import { techMarquee } from "@/lib/site";

const wrap = (min: number, max: number, v: number) => {
  const r = max - min;
  return ((((v - min) % r) + r) % r) + min;
};

export function Marquee() {
  const reduce = useReducedMotion();
  const items = [...techMarquee, ...techMarquee];

  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollV = useVelocity(scrollY);
  const smoothV = useSpring(scrollV, { damping: 50, stiffness: 350 });
  const vFactor = useTransform(smoothV, [-1200, 0, 1200], [-3, 0, 3], {
    clamp: false,
  });
  const skew = useTransform(smoothV, [-1600, 0, 1600], [-7, 0, 7], {
    clamp: true,
  });
  const dir = useRef(1);

  useAnimationFrame((_, delta) => {
    if (reduce) return;
    let move = dir.current * 0.005 * delta; // base drift (% of width per ms)
    const vf = vFactor.get();
    if (vf < 0) dir.current = -1;
    else if (vf > 0) dir.current = 1;
    move += dir.current * Math.abs(vf) * 0.012 * delta; // scroll adds speed
    baseX.set(baseX.get() + move);
  });

  const x = useTransform(baseX, (v) => `${wrap(-50, 0, v)}%`);

  return (
    <div className="relative overflow-hidden py-10">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-bg to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-bg to-transparent"
        aria-hidden
      />
      <motion.div
        style={{ x, skewX: reduce ? 0 : skew }}
        className="flex w-max items-center gap-3"
      >
        {items.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="whitespace-nowrap rounded-full glass px-4 py-2 font-mono text-sm text-muted"
          >
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
