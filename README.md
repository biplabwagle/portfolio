<div align="center">

# ◐ Biplab Wagle — Portfolio

**A calm, cinematic developer portfolio — one site, seven living themes, and a globe that unfolds into the page.**

[![Live](https://img.shields.io/badge/live-waglegroup.com-8b5cf6?style=for-the-badge)](https://waglegroup.web.app)
[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React_19-149ECA?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)

[**Live site →**](https://waglegroup.web.app) · [GlassFocus](https://www.glassfocus.app/) · [App Store](https://apps.apple.com/us/app/glassfocus-focus-todos/id6757988398) · [LinkedIn](https://www.linkedin.com/in/biplab-wagle-3953ba119/) · [X](https://twitter.com/bipz17)

</div>

---

## ✦ Overview

I'm **Biplab Wagle** — a Lead Software Engineer (8+ years across banking, healthcare & information services) and the founder of **[GlassFocus](https://www.glassfocus.app/)**, a cinematic deep‑work app on iPhone, iPad, Mac & web. This is my portfolio: a single, fully‑static site engineered to feel *alive* — calm and mesmerizing, in the spirit of GlassFocus, rather than flashy.

It ships with **7 completely different switchable themes**, a research‑backed **immersive interaction layer**, and a signature **WebGL globe intro** — the live page wraps a spinning globe that unfolds, like Earth flattening into a map, on every load and every theme change.

> 🎬 Open the [live site](https://waglegroup.web.app), press **⌘K**, flip through the themes, and try the Konami code (`↑↑↓↓←→←→BA`).

---

## ✨ Highlights

- **🌍 Globe intro** — a raw‑WebGL sphere wrapped in a live snapshot of the actual page spins one full rotation, then unrolls (arc‑length projection, zero zoom‑overshoot) and cross‑fades seamlessly into the page. Replays on every theme change.
- **🎨 7 living themes** — same content, radically different look & feel. Tokens swap palette, typography, radii, surfaces, glows and the animated background.
- **🪄 Hypnotic layer** — Lenis momentum scroll, a cursor‑reactive flow‑field background, a custom particle cursor, magnetic CTAs, 3D tilt, scroll‑velocity marquee, and section‑dot wayfinding.
- **⌨️ ⌘K command palette** — jump to any section, switch themes, open links.
- **🥚 Easter eggs** — Konami code → confetti, a spotlight glow on cards, text‑scramble reveals.
- **♿ Accessible & fast** — every effect is gated behind `prefers-reduced-motion` and pointer type; touch devices get their own tactile effects. Statically exported — no server, instant loads.

---

## 🎨 The 7 themes

Toggle via the floating palette button (bottom‑right) or **⌘K**. The choice persists and is applied before first paint (no flash).

| Theme | Vibe | Typography |
|-------|------|------------|
| **Aurora Glass** *(default)* | Dark glassmorphism, drifting violet/cyan aurora | Geist |
| **Editorial** | Light, literary, crimson accent | Playfair Display · Manrope |
| **Terminal** | Phosphor green on black, scanlines | JetBrains Mono |
| **Brutalist** | Cream, thick black borders, hard shadows, uppercase | Space Grotesk |
| **Sunset** | Warm peach/rose mesh, extra‑round, soft | Sora · Manrope |
| **Noir Gold** | Charcoal + champagne‑gold luxury | Fraunces |
| **Cyberwave** | Neon pink/cyan, perspective horizon grid | Orbitron · Rajdhani |

Every theme is defined as a block of CSS variables under `[data-theme="…"]` in [`app/globals.css`](app/globals.css) — palette, fonts, radii, surfaces, glows, even the background scene.

---

## 🪄 Interaction layer

All themed, all gated for `prefers-reduced-motion` and touch.

| Effect | What it does | File |
|--------|--------------|------|
| **Globe intro** | Page wraps a WebGL sphere, spins, unfolds into the live page | [`GlobeIntro.tsx`](components/effects/GlobeIntro.tsx) |
| **Lenis smooth scroll** | Buttery inertia scrolling | [`SmoothScroll.tsx`](components/effects/SmoothScroll.tsx) |
| **Flow‑field background** | Particles stream along a noise field, swirl around the cursor | [`FlowField.tsx`](components/effects/FlowField.tsx) |
| **Dynamic cursor** | Comet dot + velocity‑stretched ring, particle wake, context labels | [`Cursor.tsx`](components/effects/Cursor.tsx) |
| **Touch FX** | Tap ripples + particle bursts on touch devices | [`TouchFX.tsx`](components/effects/TouchFX.tsx) |
| **⌘K command palette** | Navigate · switch themes · open links | [`CommandPalette.tsx`](components/effects/CommandPalette.tsx) |
| **Magnetic buttons / 3D tilt** | CTAs pull to the cursor; hero & device mock tilt | [`Magnetic.tsx`](components/effects/Magnetic.tsx) · [`Tilt.tsx`](components/effects/Tilt.tsx) |
| **Spotlight · Scramble · Scroll progress** | Mouse‑follow card glow, decode‑in headings, top progress bar | [`effects/`](components/effects) |
| **Konami easter egg** | `↑↑↓↓←→←→BA` → confetti + Cyberwave | [`Konami.tsx`](components/effects/Konami.tsx) |

---

## 🛠️ Tech stack

- **[Next.js 16](https://nextjs.org)** (App Router) · **React 19** · **TypeScript** — statically exported (`output: "export"`)
- **[Tailwind CSS v4](https://tailwindcss.com)** — design tokens via `@theme`
- **[Motion](https://motion.dev)** (Framer Motion) · **[Lenis](https://lenis.dev)** · **raw WebGL** (no three.js) · **html‑to‑image**
- **[lucide-react](https://lucide.dev)** icons · **[Geist](https://vercel.com/font)** + 9 theme fonts via `next/font`
- **[Firebase Hosting](https://firebase.google.com/docs/hosting)** + **Cloudflare** DNS

---

## 🚀 Getting started

```bash
git clone https://github.com/biplabwagle/portfolio.git
cd portfolio
npm install
npm run dev        # → http://localhost:3000
```

```bash
npm run build      # static export → out/
npm run deploy     # build + deploy to Firebase Hosting
```

---

## 🧩 Project structure

```
app/
  layout.tsx        # fonts, metadata, pre-paint theme script, mounts all effects
  page.tsx          # section composition
  globals.css       # design tokens + 7 theme blocks + utilities
components/
  Nav · Hero · About · Experience · GlassFocusShowcase · Work · Approach · Contact · Footer
  ThemeProvider · ThemeSwitcher · Background · FocusRing · Marquee
  effects/          # GlobeIntro · Cursor · TouchFX · FlowField · SmoothScroll
                    # SectionDots · CommandPalette · Konami · Magnetic · Tilt · …
lib/
  site.ts           # ← all content lives here (edit this)
  themes.ts         # theme registry
```

---

## ✏️ Make it yours

Almost all content lives in **[`lib/site.ts`](lib/site.ts)** — name, role, headline, experience, projects, capabilities, socials. Search for `TODO` for the spots to personalize. Colors, glass, gradients and animations live in [`app/globals.css`](app/globals.css).

---

## ☁️ Deployment

Statically exported and deployed to **Firebase Hosting**, with the apex domain `waglegroup.com` on **Cloudflare** DNS. The full walkthrough — including the Cloudflare proxy/SSL gotchas — is in **[`DEPLOY.md`](DEPLOY.md)**.

```bash
npm run deploy
```

---

<div align="center">

**Designed & built end‑to‑end by Biplab Wagle** — with [Next.js](https://nextjs.org), [Tailwind](https://tailwindcss.com) & a little AI.

This is my personal portfolio — feel free to draw inspiration, but please don't clone it 1:1. 💜

[waglegroup.com](https://waglegroup.web.app) · [GlassFocus](https://www.glassfocus.app/) · [LinkedIn](https://www.linkedin.com/in/biplab-wagle-3953ba119/) · [X @bipz17](https://twitter.com/bipz17)

</div>
