"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Apple, ArrowRight, ArrowUpRight, Play } from "lucide-react";
import { site, stats } from "@/lib/site";
import { Magnetic } from "./effects/Magnetic";
import { Tilt } from "./effects/Tilt";
import { FlipWord } from "./effects/FlipWord";

const ease = [0.16, 1, 0.3, 1] as const;

type HeroProduct = {
  name: string;
  icon: string;
  blurb: string;
  href?: string;
  label?: string;
  stores?: { label: string; href: string; Icon: typeof Apple }[];
};

export function Hero() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const copyY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    <section
      id="top"
      ref={ref}
      className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 pb-20 pt-32 lg:pt-28"
    >
      <div className="grid items-center gap-12 lg:grid-cols-12">
        {/* Left: copy */}
        <motion.div
          style={reduce ? undefined : { y: copyY, opacity: copyOpacity }}
          className="lg:col-span-7"
        >
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
            className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-medium text-muted"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Available for select work & collaborations
          </motion.div>

          <h1 className="mt-6 text-[clamp(2.6rem,7vw,4.7rem)] font-semibold leading-[1.02] tracking-tight text-balance">
            <motion.span
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease, delay: 0.1 }}
              className="block"
            >
              {site.headline.lead}{" "}
              <FlipWord words={site.headline.rotate} className="gradient-text" />,
            </motion.span>
            {site.headline.rest.map((line, i) => (
              <motion.span
                key={line}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease, delay: 0.18 + i * 0.08 }}
                className="block"
              >
                {i === 0 ? <span className="gradient-text">{line}</span> : line}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.4 }}
            className="mt-6 max-w-xl text-base leading-relaxed text-muted text-balance sm:text-lg"
          >
            {site.intro}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.5 }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Magnetic>
              <a
                href="#work"
                data-cursor-label="View"
                className="group inline-flex items-center gap-2 rounded-xl bg-fg px-5 py-3 text-sm font-medium text-bg transition-transform duration-300 hover:scale-[1.03]"
              >
                View my work
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </a>
            </Magnetic>
            <Magnetic>
              <a
                href={site.socials.glassfocus}
                target="_blank"
                rel="noreferrer"
                data-cursor-label="Visit"
                className="group inline-flex items-center gap-2 rounded-xl glass px-5 py-3 text-sm font-medium text-fg transition-colors hover:border-[var(--color-border-strong)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/glassfocus.png"
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5 rounded-md"
                />
                Explore GlassFocus
                <ArrowUpRight className="h-4 w-4 text-muted transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </Magnetic>
          </motion.div>
        </motion.div>

        {/* Right: floating status card */}
        <motion.div
          initial={{ opacity: 0, y: 30, rotateX: 8 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1, ease, delay: 0.35 }}
          className="lg:col-span-5"
        >
          <Tilt className="relative mx-auto max-w-sm">
            <div className="card-sheen gradient-border rounded-3xl glass-strong p-6 shadow-(--t-card-glow)">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
                  Shipped &amp; live
                </span>
                <span className="rounded-full bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-iris">
                  2 PRODUCTS
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {(
                  [
                    {
                      name: "GlassFocus",
                      icon: "/glassfocus.png",
                      blurb: "Pomodoro focus app · iOS · Android · Mac",
                      stores: [
                        { label: "App Store", href: site.socials.appstore, Icon: Apple },
                        { label: "Google Play", href: site.socials.googleplay, Icon: Play },
                      ],
                    },
                    {
                      name: "ToolsDeck",
                      icon: "/toolsdeck.svg",
                      blurb: "102 private, client-side web tools",
                      href: site.socials.toolsdeck,
                      label: "Open",
                    },
                  ] as HeroProduct[]
                ).map((p) => {
                  const rowClass =
                    "hover-lift group flex items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-surface p-3.5";
                  const inner = (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.icon}
                        alt=""
                        width={48}
                        height={48}
                        className="h-12 w-12 shrink-0 rounded-2xl"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-fg">{p.name}</span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            Live
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted">
                          {p.blurb}
                        </p>
                      </div>
                    </>
                  );

                  // Multi-store product (GlassFocus): a non-link row with one
                  // icon-link per store, so both options are reachable in place.
                  return p.stores ? (
                    <div key={p.name} className={rowClass}>
                      {inner}
                      <div className="flex shrink-0 items-center gap-1.5">
                        {p.stores.map((s) => {
                          const Icon = s.Icon;
                          return (
                            <a
                              key={s.label}
                              href={s.href}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`${p.name} on ${s.label}`}
                              data-cursor-label={s.label}
                              className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--color-border)] text-muted transition-colors hover:border-[var(--color-border-strong)] hover:text-fg"
                            >
                              <Icon className="h-4 w-4" />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <a
                      key={p.name}
                      href={p.href}
                      target="_blank"
                      rel="noreferrer"
                      data-cursor-label={p.label}
                      className={rowClass}
                    >
                      {inner}
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-faint transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </a>
                  );
                })}
              </div>

              <p className="mt-4 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
                Designed, built &amp; shipped end-to-end
              </p>
            </div>
          </Tilt>
        </motion.div>
      </div>

      {/* Stat strip */}
      <motion.dl
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease, delay: 0.7 }}
        className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl glass md:grid-cols-4"
      >
        {stats.map((s) => (
          <div key={s.label} className="bg-bg/20 px-5 py-5">
            <dt className="text-lg font-semibold tracking-tight text-fg">
              {s.value}
            </dt>
            <dd className="mt-1 text-xs text-muted">{s.label}</dd>
          </div>
        ))}
      </motion.dl>
    </section>
  );
}
