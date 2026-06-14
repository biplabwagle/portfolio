import type { Metadata } from "next";
import {
  Fraunces,
  Geist,
  Geist_Mono,
  JetBrains_Mono,
  Manrope,
  Orbitron,
  Playfair_Display,
  Rajdhani,
  Sora,
  Space_Grotesk,
} from "next/font/google";
import "./globals.css";
import { Background } from "@/components/Background";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Cursor } from "@/components/effects/Cursor";
import { TouchFX } from "@/components/effects/TouchFX";
import { Spotlight } from "@/components/effects/Spotlight";
import { ScrollProgress } from "@/components/effects/ScrollProgress";
import { CommandPalette } from "@/components/effects/CommandPalette";
import { Konami } from "@/components/effects/Konami";
import { FlowField } from "@/components/effects/FlowField";
import { SmoothScroll } from "@/components/effects/SmoothScroll";
import { SectionDots } from "@/components/effects/SectionDots";
import { GlobeIntro } from "@/components/effects/GlobeIntro";
import { SnakeGame } from "@/components/effects/SnakeGame";
import { EasterEggs } from "@/components/effects/EasterEggs";
import { site } from "@/lib/site";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });
const grotesk = Space_Grotesk({ variable: "--font-grotesk", subsets: ["latin"] });
const sora = Sora({ variable: "--font-sora", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });
const orbitron = Orbitron({ variable: "--font-orbitron", subsets: ["latin"] });
const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fontVars = [
  geistSans.variable,
  geistMono.variable,
  playfair.variable,
  manrope.variable,
  jetbrains.variable,
  grotesk.variable,
  sora.variable,
  fraunces.variable,
  orbitron.variable,
  rajdhani.variable,
].join(" ");

// Applies the saved theme before first paint so there's no flash.
const themeInitScript = `(function(){try{var v=["glass","editorial","terminal","brutalist","sunset","noir","neon"];var t=localStorage.getItem("bw-theme");document.documentElement.setAttribute("data-theme",v.indexOf(t)>-1?t:"glass");}catch(e){document.documentElement.setAttribute("data-theme","glass");}})();`;

export const metadata: Metadata = {
  metadataBase: new URL("https://waglegroup.com"),
  title: {
    default: `${site.name} — ${site.role}`,
    template: `%s — ${site.name}`,
  },
  description: site.intro,
  keywords: [
    "Biplab Wagle",
    "Lead Software Engineer",
    "Full Stack Developer",
    "Java",
    "Spring Boot",
    "React",
    "AI Engineer",
    "GlassFocus",
    "Next.js",
    "LLM",
  ],
  authors: [{ name: site.name }],
  openGraph: {
    title: `${site.name} — ${site.role}`,
    description: site.intro,
    type: "website",
    siteName: site.name,
    url: "https://waglegroup.com",
    images: [
      {
        url: "/og.png",
        width: 1600,
        height: 840,
        alt: `${site.name} — ${site.role}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.role}`,
    description: site.intro,
    creator: "@bipz17",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontVars} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      {/* suppressHydrationWarning: browser extensions (ColorZilla, Grammarly,
          etc.) inject attributes on <body> before React hydrates. */}
      <body className="min-h-full" suppressHydrationWarning>
        <ThemeProvider>
          <Background />
          <FlowField />
          {/* Readability scrim: mutes the animated background just enough to keep
              text legible on every theme, without hiding the effect. */}
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 -z-10 bg-bg/15"
          />
          <ScrollProgress />
          <SmoothScroll>{children}</SmoothScroll>
          <SectionDots />
          <ThemeSwitcher />
          <CommandPalette />
          <Konami />
          <Spotlight />
          <Cursor />
          <TouchFX />
          <GlobeIntro />
          <SnakeGame />
          <EasterEggs />
        </ThemeProvider>
      </body>
    </html>
  );
}
