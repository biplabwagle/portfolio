/**
 * The 7 site themes. Each one swaps palette, typography, radii, surfaces,
 * and the animated background — content stays identical.
 * The actual token values live in app/globals.css under [data-theme="..."].
 */

export const THEME_IDS = [
  "glass",
  "editorial",
  "terminal",
  "brutalist",
  "sunset",
  "noir",
  "neon",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export type ThemeMeta = {
  id: ThemeId;
  name: string;
  tagline: string;
  /** swatch preview colors: [bg, fg, accent] */
  dots: [string, string, string];
};

export const themes: ThemeMeta[] = [
  { id: "glass", name: "Aurora Glass", tagline: "Dark glassmorphism", dots: ["#06060d", "#818cf8", "#22d3ee"] },
  { id: "editorial", name: "Editorial", tagline: "Light & literary", dots: ["#faf9f5", "#16161a", "#e11d48"] },
  { id: "terminal", name: "Terminal", tagline: "Phosphor & mono", dots: ["#020604", "#22c55e", "#86efac"] },
  { id: "brutalist", name: "Brutalist", tagline: "Bold & raw", dots: ["#f4efe6", "#111111", "#ff4d00"] },
  { id: "sunset", name: "Sunset", tagline: "Warm & soft", dots: ["#fff5ee", "#4a2b33", "#ff5e78"] },
  { id: "noir", name: "Noir Gold", tagline: "Dark luxury", dots: ["#0b0b0f", "#ece6d8", "#d4af6e"] },
  { id: "neon", name: "Cyberwave", tagline: "Electric neon", dots: ["#090015", "#ff2da0", "#00e5ff"] },
];

export const DEFAULT_THEME: ThemeId = "editorial";
export const THEME_STORAGE_KEY = "bw-theme";
