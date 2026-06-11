import { navLinks, site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="relative border-t border-[var(--color-border)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-iris to-cyan text-sm font-bold text-bg">
            {site.initials}
          </span>
          <div>
            <p className="text-sm font-medium text-fg">{site.name}</p>
            <p className="text-xs text-faint">{site.role}</p>
          </div>
        </div>

        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted transition-colors hover:text-fg"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="border-t border-[var(--color-border)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-5 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name}. Crafted with Next.js,
            Tailwind & a little AI.
          </p>
          <p className="font-mono">
            Press{" "}
            <kbd className="rounded border border-[var(--color-border)] bg-surface px-1.5 py-0.5 text-[10px] text-muted">
              ⌘K
            </kbd>{" "}
            · try the{" "}
            <span className="text-muted">↑↑↓↓←→←→BA</span> code
          </p>
        </div>
      </div>
    </footer>
  );
}
