/* ----------------------------------------------------------------------------
   Content for THE DIG — strata (career eras, newest on top) and buried
   artifacts. Facts are pulled from lib/site.ts so the game and the classic
   résumé can never drift apart.
---------------------------------------------------------------------------- */

import { experience, glassFocus, education, site } from "@/lib/site";
import type { ArtifactSpec } from "./sandEngine";

export type ArtifactCard = {
  id: string;
  era: string;
  title: string;
  subtitle: string;
  period: string;
  lines: string[];
  links?: { label: string; href: string }[];
};

/* Sediment palette — one calm, night-sand world regardless of site theme.
   Newest sand on top (bright), oldest at the bottom (dark umber). */
export const DIG_BG = "#0b0c13";
export const STRATA_COLORS = [
  "#e9cb8f", // 2025–now
  "#d9b476", // 2024–25
  "#c69d62", // 2022–24
  "#b08752", // 2021–22
  "#997145", // 2019–20
  "#7f5c3a", // 2017–19
  "#644834", // education bedrock
];

/** Cumulative bottom-edge of each stratum, as a fraction of the sand region. */
export const STRATA_FRACTIONS = [0.15, 0.29, 0.45, 0.6, 0.75, 0.9, 1.0];

export const ERA_LABELS = [
  "2025 – now",
  "2024 – 25",
  "2022 – 24",
  "2021 – 22",
  "2019 – 20",
  "2017 – 19",
  "Foundations",
];

/* 12-wide pixel glyphs. '#' = solid artifact cell. Kept chunky so a fingertip
   can find them and the unearth check has enough cells to sample. */
const GLYPHS: Record<string, string[]> = {
  vault: [
    "############",
    "#..........#",
    "#...####...#",
    "#..#....#..#",
    "#..#.##.#..#",
    "#..#.##.#..#",
    "#..#....#..#",
    "#...####...#",
    "#..........#",
    "############",
  ],
  hourglass: [
    "############",
    ".#........#.",
    ".#.######.#.",
    "..#.####.#..",
    "...#.##.#...",
    "...#.##.#...",
    "..#..##..#..",
    ".#...##...#.",
    ".#..####..#.",
    "############",
  ],
  tiles: [
    "#####..#####",
    "#####..#####",
    "#####..#####",
    "#####..#####",
    "............",
    "#####..#####",
    "#####..#####",
    "#####..#####",
    "#####..#####",
  ],
  shield: [
    "############",
    "#..........#",
    "#..#....#..#",
    "#...#..#...#",
    "#....##....#",
    ".#...##...#.",
    ".#........#.",
    "..#......#..",
    "...#....#...",
    ".....##.....",
  ],
  pipe: [
    "##..........",
    "####........",
    "..####......",
    "....####....",
    "......####..",
    "........####",
    "......####..",
    "....####....",
    "..####......",
    "####........",
    "##..........",
  ],
  heart: [
    "..###..###..",
    ".#####.####.",
    "############",
    "############",
    ".##########.",
    "..########..",
    "...######...",
    "....####....",
    ".....##.....",
  ],
  envelope: [
    "############",
    "#..........#",
    "##........##",
    "#.##....##.#",
    "#...####...#",
    "#..........#",
    "#..........#",
    "############",
  ],
  scroll: [
    "..########..",
    ".#........#.",
    "#..######..#",
    "#..........#",
    "#..######..#",
    "#..........#",
    "#..####....#",
    ".#........#.",
    "..########..",
  ],
  gradcap: [
    ".....##.....",
    "...######...",
    ".##########.",
    "############",
    ".##########.",
    "....####....",
    "....####....",
    "....#..#....",
    "....####....",
  ],
};

const exp = experience; // newest → oldest, from lib/site.ts

/** Placement (x, y as fractions) + the card each artifact reveals. */
export const DIG_ARTIFACTS: { spec: ArtifactSpec; card: ArtifactCard }[] = [
  {
    spec: { id: "lead", glyph: GLYPHS.vault, x: 0.28, y: 0.07 },
    card: {
      id: "lead",
      era: ERA_LABELS[0],
      title: exp[0].role,
      subtitle: exp[0].org,
      period: exp[0].period,
      lines: exp[0].bullets.slice(0, 2),
    },
  },
  {
    spec: { id: "glassfocus", glyph: GLYPHS.hourglass, x: 0.6, y: 0.08 },
    card: {
      id: "glassfocus",
      era: "Founder · shipped",
      title: glassFocus.name,
      subtitle: glassFocus.tagline,
      period: "Live on iPhone · iPad · Mac · Android",
      lines: [glassFocus.description],
      links: [
        { label: "App Store", href: glassFocus.links.appstore },
        { label: "Google Play", href: glassFocus.links.googleplay },
      ],
    },
  },
  {
    spec: { id: "toolsdeck", glyph: GLYPHS.tiles, x: 0.82, y: 0.1 },
    card: {
      id: "toolsdeck",
      era: "Maker · shipped",
      title: "ToolsDeck",
      subtitle: "102 private, client-side web tools",
      period: "Live on the web",
      lines: ["PDF, JSON, regex, images, QR, hashing — everything runs in the browser; nothing is ever uploaded."],
      links: [{ label: "toolsdeck.app", href: site.socials.toolsdeck }],
    },
  },
  {
    spec: { id: "sr-2024", glyph: GLYPHS.shield, x: 0.22, y: 0.36 },
    card: {
      id: "sr-2024",
      era: ERA_LABELS[1],
      title: exp[1].role,
      subtitle: exp[1].org,
      period: exp[1].period,
      lines: exp[1].bullets.slice(0, 2),
    },
  },
  {
    spec: { id: "info-2022", glyph: GLYPHS.pipe, x: 0.68, y: 0.51 },
    card: {
      id: "info-2022",
      era: ERA_LABELS[2],
      title: exp[2].role,
      subtitle: exp[2].org,
      period: exp[2].period,
      lines: exp[2].bullets.slice(0, 2),
    },
  },
  {
    spec: { id: "health-2021", glyph: GLYPHS.heart, x: 0.34, y: 0.66 },
    card: {
      id: "health-2021",
      era: ERA_LABELS[3],
      title: exp[3].role,
      subtitle: exp[3].org,
      period: exp[3].period,
      lines: exp[3].bullets.slice(0, 2),
    },
  },
  {
    spec: { id: "bank-2019", glyph: GLYPHS.envelope, x: 0.74, y: 0.8 },
    card: {
      id: "bank-2019",
      era: ERA_LABELS[4],
      title: exp[4].role,
      subtitle: exp[4].org,
      period: exp[4].period,
      lines: exp[4].bullets.slice(0, 2),
    },
  },
  {
    spec: { id: "first-2017", glyph: GLYPHS.scroll, x: 0.26, y: 0.9 },
    card: {
      id: "first-2017",
      era: ERA_LABELS[5],
      title: exp[5].role,
      subtitle: exp[5].org,
      period: exp[5].period,
      lines: exp[5].bullets.slice(0, 2),
    },
  },
  {
    spec: { id: "education", glyph: GLYPHS.gradcap, x: 0.56, y: 0.965 },
    card: {
      id: "education",
      era: ERA_LABELS[6],
      title: education[0].degree,
      subtitle: education[1].degree,
      period: "Where it all started",
      lines: [education[0].detail, education[1].detail],
    },
  },
];

export const TOTAL_ARTIFACTS = DIG_ARTIFACTS.length;
