import { GraduationCap } from "lucide-react";
import { education, experience } from "@/lib/site";
import { Reveal } from "./ui/Reveal";
import { SectionHeading } from "./ui/SectionHeading";

export function Experience() {
  return (
    <section
      id="experience"
      className="relative mx-auto max-w-6xl px-6 py-24 sm:py-28"
    >
      <SectionHeading
        eyebrow="Track record"
        title={
          <>
            8+ years where <span className="gradient-text">downtime wasn’t an option</span>.
          </>
        }
        description="Banking, healthcare, and information services — I lead teams and modernize the platforms a business can't afford to have go down."
      />

      <div className="relative mt-14">
        {/* Timeline rail */}
        <div
          className="absolute bottom-4 left-[7px] top-2 w-px bg-gradient-to-b from-iris/60 via-[var(--color-border-strong)] to-transparent sm:left-[9px]"
          aria-hidden
        />

        <ol className="space-y-6">
          {experience.map((job, i) => (
            <li key={`${job.role}-${job.period}`} className="relative pl-10 sm:pl-14">
              {/* Timeline dot */}
              <span
                className="absolute left-0 top-7 grid h-[15px] w-[15px] place-items-center rounded-full border border-[var(--color-border-strong)] bg-bg sm:left-[2px]"
                aria-hidden
              >
                <span
                  className={`h-[7px] w-[7px] rounded-full ${
                    job.current
                      ? "bg-gradient-to-br from-iris to-cyan animate-pulse-glow"
                      : "bg-faint"
                  }`}
                />
              </span>

              <Reveal delay={Math.min(i * 0.05, 0.2)}>
                <article className="hover-lift card-sheen spotlight rounded-2xl glass p-6 sm:p-7">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="text-lg font-semibold tracking-tight text-fg sm:text-xl">
                      {job.role}
                    </h3>
                    <span className="font-mono text-xs text-faint">
                      {job.period}
                    </span>
                  </div>

                  <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm">
                    <span className="font-medium text-iris">{job.org}</span>
                    <span className="text-faint">·</span>
                    <span className="text-muted">{job.type}</span>
                    <span className="text-faint">·</span>
                    <span className="text-muted">{job.location}</span>
                  </p>

                  <ul className="mt-4 space-y-1.5">
                    {job.bullets.map((b) => (
                      <li key={b} className="flex gap-2.5 text-sm leading-relaxed text-muted">
                        <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-cyan" aria-hidden />
                        {b}
                      </li>
                    ))}
                  </ul>

                  <ul className="mt-4 flex flex-wrap gap-2">
                    {job.skills.map((s) => (
                      <li
                        key={s}
                        className="rounded-lg border border-[var(--color-border)] bg-surface px-2.5 py-1 font-mono text-[11px] text-muted"
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>

      {/* Education */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {education.map((ed, i) => (
          <Reveal key={ed.degree} delay={i * 0.07}>
            <div className="flex items-center gap-4 rounded-2xl glass px-5 py-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-iris to-cyan text-bg">
                <GraduationCap className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-fg">{ed.degree}</p>
                <p className="mt-0.5 text-xs text-muted">{ed.detail}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
