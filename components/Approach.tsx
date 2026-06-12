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
        eyebrow="The way I work"
        title={
          <>
            Fast to ship. <span className="gradient-text">Safe to trust</span>.
          </>
        }
        description="AI is leverage, not a shortcut — I keep taste, correctness, and your users in the loop the whole way, from your idea to live."
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
