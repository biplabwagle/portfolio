"use client";

import { useEffect, useRef, useState } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#%&*/<>";

type ScrambleTextProps = {
  text: string;
  className?: string;
  /** ms per reveal step */
  speed?: number;
  /** also re-scramble on hover */
  hover?: boolean;
};

/**
 * Decodes its text from random glyphs when it scrolls into view (once),
 * and optionally re-runs on hover. Respects prefers-reduced-motion by
 * rendering the final text immediately.
 */
export function ScrambleText({
  text,
  className,
  speed = 28,
  hover = true,
}: ScrambleTextProps) {
  const [display, setDisplay] = useState(text);
  const ref = useRef<HTMLSpanElement>(null);
  const frame = useRef<number>(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const run = () => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setDisplay(text);
      return;
    }
    if (timer.current) clearInterval(timer.current);
    let progress = 0;
    timer.current = setInterval(() => {
      progress += 1;
      const out = text
        .split("")
        .map((ch, i) => {
          if (ch === " ") return " ";
          if (i < progress) return ch;
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        })
        .join("");
      setDisplay(out);
      if (progress >= text.length && timer.current) {
        clearInterval(timer.current);
        setDisplay(text);
      }
    }, speed);
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          run();
          io.disconnect();
        }
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer.current) clearInterval(timer.current);
      cancelAnimationFrame(frame.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <span
      ref={ref}
      className={className}
      onMouseEnter={hover ? run : undefined}
    >
      {display}
    </span>
  );
}
