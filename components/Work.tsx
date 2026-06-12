import type { ElementType } from "react";
import { ArrowUpRight } from "lucide-react";
import { projects } from "@/lib/site";
import { Reveal } from "./ui/Reveal";
import { SectionHeading } from "./ui/SectionHeading";

export function Work() {
  return (
    <section id="work" className="relative mx-auto max-w-6xl px-6 py-24 sm:py-28">
      <SectionHeading
        eyebrow="Proof, not promises"
        title={
          <>
            Real products, <span className="gradient-text">live and in users’ hands</span>.
          </>
        }
        description="Not concept decks or case-study theater — software that's shipped and earning its keep, with the polish that makes it feel inevitable."
      />

      <div className="mt-14 grid gap-5 md:grid-cols-2">
        {projects.map((p, i) => {
          const Wrapper: ElementType = p.href ? "a" : "div";
          return (
            <Reveal
              key={p.title}
              delay={i * 0.07}
              className={p.featured ? "md:col-span-2" : ""}
            >
              <Wrapper
                {...(p.href
                  ? {
                      href: p.href,
                      target: "_blank",
                      rel: "noreferrer",
                      "data-cursor-label": "Open",
                    }
                  : {})}
                className={`hover-lift card-sheen spotlight group flex h-full flex-col rounded-2xl glass p-7 ${
                  p.featured
                    ? "md:flex-row md:items-center md:gap-10 md:p-9"
                    : ""
                } ${p.href ? "cursor-pointer" : ""}`}
              >
                <div className={p.featured ? "md:flex-1" : ""}>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs uppercase tracking-[0.2em] text-faint">
                      {p.category}
                    </span>
                    {p.status ? (
                      <span className="rounded-full bg-surface px-2 py-0.5 font-mono text-[10px] text-violet">
                        {p.status}
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-4 flex items-center gap-2 text-2xl font-semibold tracking-tight text-fg">
                    {p.title}
                    {p.href ? (
                      <ArrowUpRight className="h-5 w-5 text-muted transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    ) : null}
                  </h3>

                  <p
                    className={`mt-3 text-sm leading-relaxed text-muted ${
                      p.featured ? "max-w-xl" : ""
                    }`}
                  >
                    {p.description}
                  </p>

                  <ul className="mt-5 flex flex-wrap gap-2">
                    {p.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-lg border border-[var(--color-border)] bg-surface px-2.5 py-1 font-mono text-[11px] text-muted"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>

                {p.featured ? (
                  <div className="panel-glow mt-7 grid w-full place-items-center rounded-2xl border border-[var(--color-border)] py-10 md:mt-0 md:w-80 md:py-14">
                    <div className="flex flex-col items-center text-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/glassfocus.png"
                        alt="GlassFocus app icon"
                        width={80}
                        height={80}
                        className="accent-glow h-20 w-20 rounded-3xl"
                      />
                      <p className="mt-4 font-mono text-xs uppercase tracking-[0.25em] text-faint">
                        Calm, deep focus
                      </p>
                    </div>
                  </div>
                ) : null}
              </Wrapper>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
