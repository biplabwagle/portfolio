"use client";

import { motion } from "motion/react";
import { ArrowUpRight, Apple, Check, Globe } from "lucide-react";
import { glassFocus } from "@/lib/site";
import { Reveal } from "./ui/Reveal";
import { FocusRing } from "./FocusRing";
import { Magnetic } from "./effects/Magnetic";
import { Tilt } from "./effects/Tilt";

const ease = [0.16, 1, 0.3, 1] as const;

export function GlassFocusShowcase() {
  return (
    <section
      id="glassfocus"
      className="relative mx-auto max-w-6xl px-6 py-24 sm:py-28"
    >
      <Reveal>
        <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-faint">
          <span className="h-px w-6 bg-gradient-to-r from-iris/0 to-iris/80" />
          Featured product
        </span>
      </Reveal>

      <div className="mt-8 overflow-hidden rounded-4xl glass-strong card-sheen">
        <div className="grid items-stretch lg:grid-cols-2">
          {/* Left: copy */}
          <div className="flex flex-col justify-center p-8 sm:p-12">
            <div className="flex items-center gap-3">
              <span className="accent-glow grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-iris to-cyan text-bg">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="8"
                    stroke="currentColor"
                    strokeWidth="2"
                    opacity="0.35"
                  />
                  <path
                    d="M12 4a8 8 0 0 1 8 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <div>
                <h3 className="text-2xl font-semibold tracking-tight text-fg">
                  {glassFocus.name}
                </h3>
                <p className="text-sm text-violet">{glassFocus.tagline}</p>
              </div>
            </div>

            <p className="mt-6 text-base leading-relaxed text-muted">
              {glassFocus.description}
            </p>

            <ul className="mt-7 grid gap-2.5 sm:grid-cols-2">
              {glassFocus.features.map((f, i) => (
                <motion.li
                  key={f}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease, delay: i * 0.05 }}
                  className="flex items-start gap-2.5 text-sm text-fg/90"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
                  {f}
                </motion.li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Magnetic>
                <a
                  href={glassFocus.links.site}
                  target="_blank"
                  rel="noreferrer"
                  data-cursor-label="Visit"
                  className="group inline-flex items-center gap-2 rounded-xl bg-fg px-5 py-3 text-sm font-medium text-bg transition-transform duration-300 hover:scale-[1.03]"
                >
                  <Globe className="h-4 w-4" />
                  glassfocus.app
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </Magnetic>
              <Magnetic>
                <a
                  href={glassFocus.links.appstore}
                  target="_blank"
                  rel="noreferrer"
                  data-cursor-label="Get"
                  className="inline-flex items-center gap-2 rounded-xl glass px-5 py-3 text-sm font-medium text-fg transition-colors hover:border-[var(--color-border-strong)]"
                >
                  <Apple className="h-4 w-4" />
                  App Store
                </a>
              </Magnetic>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              {glassFocus.platforms.map((p) => (
                <span
                  key={p}
                  className="rounded-full border border-[var(--color-border)] px-3 py-1 font-mono text-[11px] text-muted"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* Right: device mock */}
          <div className="panel-glow relative flex items-center justify-center overflow-hidden border-t border-[var(--color-border)] p-10 lg:border-l lg:border-t-0">
            <div className="dot-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden />
            <Tilt max={12} className="w-full max-w-[300px]">
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease }}
              className="relative w-full rounded-4xl border border-[var(--color-border-strong)] bg-bg-soft/80 p-5 shadow-(--t-card-glow) backdrop-blur-xl"
            >
              <div className="flex items-center justify-between px-1 pb-4">
                <span className="font-mono text-[11px] text-faint">9:41</span>
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="font-mono text-[11px] text-faint">Focus</span>
                </span>
              </div>

              <div className="grid place-items-center py-2">
                <FocusRing size={216} progress={0.72} label="24:18" caption="Session 3 / 4" />
              </div>

              <div className="mt-4 rounded-2xl bg-surface p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Today</span>
                  <span className="font-mono text-fg">3h 12m</span>
                </div>
                <div className="mt-2 flex h-9 items-end gap-1.5">
                  {[40, 65, 30, 80, 55, 95, 70].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm bg-gradient-to-t from-iris/40 to-cyan/70"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
            </Tilt>
          </div>
        </div>
      </div>
    </section>
  );
}
