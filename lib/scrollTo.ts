/** Programmatic scroll that routes through Lenis when active, else native. */
export function scrollToHash(hash: string) {
  if (typeof document === "undefined") return;
  const el = document.querySelector(hash);
  if (!el) return;
  const lenis = (window as unknown as { __lenis?: { scrollTo: (t: Element, o?: object) => void } }).__lenis;
  if (lenis) {
    lenis.scrollTo(el, { offset: -90 });
  } else {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    (el as HTMLElement).scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
  }
}
