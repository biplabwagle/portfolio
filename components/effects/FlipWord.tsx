"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/**
 * Split-flap / flip-clock word rotator. Cycles through `words` on an interval,
 * flipping one letter at a time (staggered left→right) like a departure board.
 * Respects prefers-reduced-motion (shows the first word, static).
 */
function FlipChar({
  char,
  pos,
  reduce,
  letterClass,
}: {
  char: string;
  pos: number;
  reduce: boolean;
  letterClass?: string;
}) {
  const [k, setK] = useState(0);
  const prev = useRef(char);

  useEffect(() => {
    if (prev.current !== char) {
      prev.current = char;
      setK((x) => x + 1);
    }
  }, [char]);

  return (
    <span
      className="relative inline-grid"
      style={{ perspective: "420px" }}
      aria-hidden
    >
      {/* invisible spacer sizes the slot to the natural letter width */}
      <span className="col-start-1 row-start-1 invisible">{char}</span>
      <AnimatePresence initial={false}>
        <motion.span
          key={k}
          className={`col-start-1 row-start-1 inline-block ${letterClass ?? ""}`}
          initial={reduce ? false : { rotateX: 90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { rotateX: -90, opacity: 0 }}
          transition={{
            duration: 0.42,
            ease: [0.3, 0.6, 0.25, 1],
            delay: reduce ? 0 : pos * 0.14,
          }}
          style={{ transformOrigin: "50% 0%", backfaceVisibility: "hidden" }}
        >
          {char}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function FlipWord({
  words,
  intervalMs = 5000,
  className,
}: {
  words: readonly string[];
  intervalMs?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce || words.length < 2) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % words.length),
      intervalMs
    );
    return () => clearInterval(id);
  }, [reduce, words.length, intervalMs]);

  const word = words[index] ?? "";

  return (
    <span className="relative inline-flex">
      <span className="sr-only">{words[0]}</span>
      {word.split("").map((ch, i) => (
        <FlipChar
          key={i}
          pos={i}
          char={ch}
          reduce={!!reduce}
          letterClass={className}
        />
      ))}
    </span>
  );
}
