import type { ReactNode } from "react";
import { Reveal } from "./Reveal";
import { ScrambleText } from "../effects/ScrambleText";

type SectionHeadingProps = {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: SectionHeadingProps) {
  return (
    <div
      className={
        align === "center"
          ? "mx-auto max-w-2xl text-center"
          : "max-w-2xl text-left"
      }
    >
      <Reveal>
        <span className="eyebrow inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-faint">
          <span className="h-px w-6 bg-gradient-to-r from-iris/0 to-iris/80" />
          <ScrambleText text={eyebrow} />
        </span>
      </Reveal>
      <Reveal delay={0.05}>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-5xl">
          {title}
        </h2>
      </Reveal>
      {description ? (
        <Reveal delay={0.1}>
          <p className="section-desc mt-4 text-base leading-relaxed text-muted text-balance sm:text-lg">
            {description}
          </p>
        </Reveal>
      ) : null}
    </div>
  );
}
