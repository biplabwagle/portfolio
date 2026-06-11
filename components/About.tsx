import { Reveal } from "./ui/Reveal";
import { SectionHeading } from "./ui/SectionHeading";
import { capabilities } from "@/lib/site";

export function About() {
  return (
    <section id="about" className="relative mx-auto max-w-6xl px-6 py-24 sm:py-28">
      <SectionHeading
        eyebrow="What I do"
        title={
          <>
            Four things I do{" "}
            <span className="gradient-text">exceptionally well</span>.
          </>
        }
        description="I work across the whole stack of shipping a product — the services that move the money, the interface people touch, the cloud it runs on, and the AI that powers it."
      />

      <div className="mt-14 grid gap-5 sm:grid-cols-2">
        {capabilities.map((cap, i) => (
          <Reveal key={cap.key} delay={i * 0.08}>
            <article className="hover-lift card-sheen spotlight group h-full rounded-2xl glass p-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-faint">{cap.eyebrow}</span>
                <span className="h-2 w-2 rounded-full bg-gradient-to-br from-iris to-cyan opacity-60 transition-opacity group-hover:opacity-100" />
              </div>

              <h3 className="mt-5 text-xl font-semibold tracking-tight text-fg">
                {cap.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {cap.blurb}
              </p>

              <ul className="mt-5 flex flex-wrap gap-2">
                {cap.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-lg border border-[var(--color-border)] bg-surface px-2.5 py-1 font-mono text-[11px] text-muted"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
