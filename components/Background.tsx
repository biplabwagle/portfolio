"use client";

import { useTheme } from "./ThemeProvider";

/**
 * Fixed full-viewport ambient background. Each theme gets a completely
 * different treatment — aurora, paper, scanlines, hard shapes, warm mesh,
 * gold hairlines, or a neon horizon grid.
 */
export function Background() {
  const { theme } = useTheme();

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg transition-colors duration-500"
    >
      {theme === "glass" && (
        <>
          <div className="absolute left-1/2 top-[-10%] h-[70vh] w-[70vh] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(124,99,246,0.45),transparent_62%)] blur-3xl animate-drift" />
          <div className="absolute right-[-10%] top-[8%] h-[55vh] w-[55vh] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.28),transparent_62%)] blur-3xl animate-drift-2" />
          <div className="absolute left-[-12%] top-[34%] h-[55vh] w-[55vh] rounded-full bg-[radial-gradient(circle,rgba(129,140,248,0.30),transparent_62%)] blur-3xl animate-drift" />
          <div className="absolute bottom-[-15%] left-1/2 h-[60vh] w-[80vh] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.18),transparent_60%)] blur-3xl animate-drift-2" />
          <div className="absolute inset-0 grid-bg" />
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-bg via-bg/60 to-transparent" />
          <div className="absolute inset-0 noise opacity-[0.035] mix-blend-soft-light" />
        </>
      )}

      {theme === "editorial" && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(225,29,72,0.04),transparent_70%)]" />
          <div className="absolute inset-0 dot-grid opacity-60" />
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#e11d48]/60 to-transparent" />
          <div className="absolute inset-0 noise opacity-[0.05] mix-blend-multiply" />
        </>
      )}

      {theme === "terminal" && (
        <>
          <div className="absolute left-[-10%] top-[-15%] h-[60vh] w-[60vh] rounded-full bg-[radial-gradient(circle,rgba(34,197,94,0.14),transparent_60%)] blur-3xl animate-drift" />
          <div className="absolute bottom-[-20%] right-[-10%] h-[55vh] w-[55vh] rounded-full bg-[radial-gradient(circle,rgba(34,197,94,0.08),transparent_60%)] blur-3xl animate-drift-2" />
          <div className="absolute inset-0 grid-bg" />
          <div className="absolute inset-0 scanlines opacity-70" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_100%_at_50%_50%,transparent_60%,rgba(0,0,0,0.5)_100%)]" />
        </>
      )}

      {theme === "brutalist" && (
        <>
          <div className="absolute inset-0 dot-grid" />
          <div className="absolute right-[6%] top-[12%] h-44 w-44 rotate-12 border-[3px] border-[#141414] opacity-[0.07]" />
          <div className="absolute left-[4%] top-[42%] h-36 w-36 rounded-full border-[3px] border-[#141414] opacity-[0.07]" />
          <div className="absolute bottom-[12%] right-[14%] h-28 w-28 -rotate-6 bg-[#ff4d00] opacity-[0.06]" />
          <div className="absolute left-[12%] top-[8%] h-20 w-20 rotate-45 bg-[#8338ec] opacity-[0.05]" />
          <div className="absolute inset-x-0 top-0 h-1.5 bg-[#141414]" />
        </>
      )}

      {theme === "sunset" && (
        <>
          <div className="absolute left-1/2 top-[-18%] h-[75vh] w-[90vh] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,157,111,0.5),transparent_62%)] blur-3xl animate-drift" />
          <div className="absolute right-[-12%] top-[20%] h-[60vh] w-[60vh] rounded-full bg-[radial-gradient(circle,rgba(255,94,120,0.32),transparent_62%)] blur-3xl animate-drift-2" />
          <div className="absolute bottom-[-18%] left-[-10%] h-[60vh] w-[70vh] rounded-full bg-[radial-gradient(circle,rgba(255,179,92,0.4),transparent_60%)] blur-3xl animate-drift" />
          <div className="absolute inset-0 noise opacity-[0.04] mix-blend-multiply" />
        </>
      )}

      {theme === "noir" && (
        <>
          <div className="absolute left-1/2 top-[-20%] h-[60vh] w-[90vh] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(212,175,110,0.13),transparent_60%)] blur-3xl animate-pulse-glow" />
          <div
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, rgba(212,175,110,0.05) 0px, rgba(212,175,110,0.05) 1px, transparent 1px, transparent 160px)",
            }}
          />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d4af6e]/70 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_120%,transparent_50%,rgba(0,0,0,0.55)_100%)]" />
          <div className="absolute inset-0 noise opacity-[0.04] mix-blend-soft-light" />
        </>
      )}

      {theme === "neon" && (
        <>
          <div className="absolute left-[-10%] top-[-12%] h-[60vh] w-[60vh] rounded-full bg-[radial-gradient(circle,rgba(255,45,160,0.3),transparent_60%)] blur-3xl animate-drift" />
          <div className="absolute right-[-12%] top-[15%] h-[55vh] w-[55vh] rounded-full bg-[radial-gradient(circle,rgba(0,229,255,0.22),transparent_60%)] blur-3xl animate-drift-2" />
          <div className="absolute bottom-[-10%] left-1/2 h-[50vh] w-[80vh] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(181,55,242,0.25),transparent_60%)] blur-3xl animate-pulse-glow" />
          {/* Perspective horizon grid */}
          <div
            className="absolute inset-x-[-40%] bottom-[-12%] h-[46vh] opacity-35 animate-neon-flicker"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(0,229,255,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,45,160,0.3) 1px, transparent 1px)",
              backgroundSize: "70px 44px",
              transform: "perspective(420px) rotateX(58deg)",
              transformOrigin: "center bottom",
              maskImage: "linear-gradient(to top, #000 30%, transparent 95%)",
              WebkitMaskImage: "linear-gradient(to top, #000 30%, transparent 95%)",
            }}
          />
          <div className="absolute inset-0 scanlines opacity-25" />
        </>
      )}
    </div>
  );
}
