import { ArrowUpRight, Mail } from "lucide-react";
import { site } from "@/lib/site";
import { Reveal } from "./ui/Reveal";
import { Magnetic } from "./effects/Magnetic";

const links = [
  { label: "GlassFocus", href: site.socials.glassfocus },
  { label: "App Store", href: site.socials.appstore },
  { label: "X / Twitter", href: site.socials.twitter },
  { label: "LinkedIn", href: site.socials.linkedin },
];

export function Contact() {
  return (
    <section id="contact" className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
      <Reveal>
        <div className="card-sheen gradient-border relative overflow-hidden rounded-4xl glass-strong px-8 py-16 text-center sm:px-12 sm:py-20">
          <span className="font-mono text-xs uppercase tracking-[0.25em] text-faint">
            Let’s build
          </span>
          <h2 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl md:text-6xl">
            Have something worth{" "}
            <span className="gradient-text">building</span>? Let’s ship it.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted text-balance sm:text-lg">
            Whether it’s a web app, an AI-powered product, or taking an idea all
            the way to the App Store — I’d love to hear about it.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Magnetic strength={0.4}>
              <a
                href={`mailto:${site.email}`}
                data-cursor-label="Email"
                className="group inline-flex items-center gap-2 rounded-xl bg-fg px-6 py-3.5 text-sm font-medium text-bg transition-transform duration-300 hover:scale-[1.03]"
              >
                <Mail className="h-4 w-4" />
                {site.email}
              </a>
            </Magnetic>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-fg"
              >
                {link.label}
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
