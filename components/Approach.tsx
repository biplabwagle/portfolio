import { approach } from "@/lib/site";
import { Reveal } from "./ui/Reveal";
import { SectionHeading } from "./ui/SectionHeading";

export function Approach() {
  return (
    <section
      id="approach"
      className="relative mx-auto max-w-6xl px-6 py-24 sm:py-28"
    >
      <SectionHeading
        eyebrow="How I work"
        title={
          <>
            From idea to{" "}
            <span className="gradient-text">shipped</span>, with AI as leverage.
          </>
        }
        description="Models make me faster, not sloppier. I keep taste, correctness, and the user in the loop the whole way."
      />

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {approach.map((item, i) => (
          <Reveal key={item.step} delay={i * 0.08}>
            <div className="hover-lift spotlight group relative h-full overflow-hidden rounded-2xl glass p-6">
              <span className="outline-num font-mono text-5xl font-semibold leading-none">
                {item.step}
              </span>
              <h3 className="mt-5 text-lg font-semibold tracking-tight text-fg">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {item.blurb}
              </p>
              <div className="mt-5 h-px w-full bg-gradient-to-r from-iris/40 via-cyan/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
