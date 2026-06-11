"use client";

import { useEffect, useState } from "react";

/**
 * True only on devices with a precise pointer (mouse/trackpad) AND when the
 * user has not asked to reduce motion. Gate all cursor/magnetic/tilt effects
 * on this so touch devices and reduced-motion users get a clean, static site.
 */
export function useInteractive() {
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setOk(fine.matches && !reduce.matches);
    update();
    fine.addEventListener("change", update);
    reduce.addEventListener("change", update);
    return () => {
      fine.removeEventListener("change", update);
      reduce.removeEventListener("change", update);
    };
  }, []);

  return ok;
}
