/* ----------------------------------------------------------------------------
   MONOLITH BREAKER — content & choreography data.
   Career eras (anonymized, matching lib/site.ts), the authored volley chart
   (a rhythm chart, not RNG spray), and the monolith's microservices.
---------------------------------------------------------------------------- */

export type Kind = "tech" | "logo" | "bug" | "mimic" | "hourglass";

export const TECH: [string, number][] = [
  ["Java", 24], ["Spring", 130], ["React", 190], ["Angular", 350],
  ["Kafka", 270], ["K8s", 210], ["AWS", 32], ["SQL", 200], ["TS", 215], ["LLMs", 280],
];

/* Career eras as biomes — background + accent shift, ambient stamp.
   Labels reuse the site's anonymized employer language. */
export type Era = {
  start: number; // seconds
  label: string;
  sub: string;
  bg: [string, string]; // vertical gradient
  glow: string; // ambient glow color
};
export const ERAS: Era[] = [
  { start: 0,   label: "FIRST COMMIT",              sub: "2017 – 19 · health records APIs",   bg: ["#0c0d15", "#11131f"], glow: "rgba(129,140,248,0.10)" },
  { start: 30,  label: "BANKING MICROSERVICES",     sub: "2019 – 20 · Kafka · Spring Boot",   bg: ["#050d08", "#081711"], glow: "rgba(34,197,94,0.10)" },
  { start: 55,  label: "HEALTHCARE PLATFORMS",      sub: "2021 – 22 · Medicaid / Medicare",   bg: ["#150c0e", "#1d1114"], glow: "rgba(255,94,120,0.10)" },
  { start: 80,  label: "GLOBAL INFORMATION SERVICES", sub: "2022 – 24 · eligibility platform", bg: ["#100e08", "#181405"], glow: "rgba(212,175,110,0.10)" },
  { start: 105, label: "FORTUNE 500 · LEAD · NOW",  sub: "React + Spring Boot product line",  bg: ["#0a0416", "#120827"], glow: "rgba(255,45,160,0.10)" },
];

/* Monolith chunks — each cut ships one microservice. */
export const SERVICES = ["AUTH", "PAYMENTS", "LEDGER", "RISK", "REPORTS", "NOTIFY"];

/* ---------------------------------------------------------------------------
   Volley chart. Compact pattern DSL expanded at load:
   [time, pattern, count, opts] — opts: b=trailing bug, m=mimic in formation,
   hg=hourglass special, slow=deploy-window slow-mo.
--------------------------------------------------------------------------- */
export type SpawnSpec = { xf: number; vxf: number; apex: number; kind: Kind; delay: number };
export type ChartEv = { at: number; slow?: boolean; orbs: SpawnSpec[] };

type Row = [number, string, number] | [number, string, number, string];
const ROWS: Row[] = [
  // Act 1 — Origin (0–30): learn the blade. Lazy arcs, first bug at 20.
  [1.0, "logo", 1],
  [3.4, "single", 1],
  [5.6, "single", 1],
  [7.6, "pair", 2],
  [9.8, "pair", 2],
  [12.0, "line", 3],
  [14.2, "pair", 2],
  [16.2, "fountain", 3],
  [18.4, "line", 3],
  [20.4, "single", 1, "b"],
  [22.2, "pair", 2],
  [24.2, "line", 3, "b"],
  [26.4, "fountain", 4],
  [28.4, "pair", 2],
  // Act 2 — Eras begin (30–55): crossing arcs, fountains, hourglass at 50.
  [30.5, "cross", 2],
  [32.5, "line", 4],
  [34.5, "cross", 2, "b"],
  [36.5, "fountain", 4],
  [38.5, "line", 3],
  [40.5, "cross", 3],
  [42.5, "fountain", 5, "b"],
  [44.5, "line", 4],
  [46.5, "cross", 2],
  [48.5, "pair", 2],
  [50.0, "hourglass", 1],
  [52.0, "line", 4, "b"],
  [54.0, "fountain", 4],
  // Act 3 — Patterns fight back (55–80): spirals, mimics from 60.
  [56.5, "spiral", 5],
  [59.0, "line", 4, "m"],
  [61.5, "spiral", 5, "b"],
  [64.0, "cross", 3, "m"],
  [66.5, "fountain", 5],
  [69.0, "spiral", 6, "m"],
  [71.5, "line", 5, "b"],
  [74.0, "cross", 3, "m"],
  [76.5, "spiral", 5, "b"],
  [79.0, "fountain", 4],
  // Act 4 — Density (80–105): snakes, mixed threats, hourglass retry at 95.
  [81.5, "snake", 6],
  [84.0, "cross", 3, "m"],
  [86.5, "snake", 6, "b"],
  [89.0, "fountain", 6, "m"],
  [91.5, "line", 5, "b"],
  [94.0, "snake", 7, "m"],
  [95.5, "hourglass", 1],
  [97.0, "cross", 4, "b"],
  [99.5, "snake", 6, "m"],
  [102.0, "fountain", 6, "b"],
  // Act 5 — Deploy windows (105–128): slow-mo alignments beg for god-swipes.
  [105.5, "deploy", 6, "slow"],
  [109.0, "snake", 6, "m"],
  [111.5, "cross", 4, "b"],
  [114.0, "deploy", 7, "slow"],
  [117.5, "spiral", 6, "m"],
  [120.0, "line", 5, "b"],
  [122.5, "deploy", 8, "slow"],
  [126.0, "cross", 4, "m"],
  [128.0, "fountain", 8],
];

export const MONOLITH_AT = 131; // volleys cease; the slab descends

const rng = (seed: number) => {
  let s = seed;
  return () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
};

export function expandChart(): ChartEv[] {
  const rand = rng(1337);
  const evs: ChartEv[] = [];
  for (const row of ROWS) {
    const [at, pat, n, flags = ""] = row;
    const orbs: SpawnSpec[] = [];
    const push = (xf: number, vxf: number, apex: number, kind: Kind = "tech", delay = 0) =>
      orbs.push({ xf, vxf, apex, kind, delay });

    switch (pat) {
      case "logo":
        push(0.5, 0.02, 0.3, "logo");
        break;
      case "single":
        push(0.3 + rand() * 0.4, (rand() - 0.5) * 0.12, 0.28 + rand() * 0.12);
        break;
      case "pair": {
        const x = 0.25 + rand() * 0.15;
        push(x, 0.08, 0.32);
        push(1 - x, -0.08, 0.32);
        break;
      }
      case "cross":
        for (let i = 0; i < n; i++)
          push(0.32 + i * 0.05, (i % 2 === 0 ? 1 : -1) * (0.1 + rand() * 0.05), 0.28 + i * 0.04, "tech", i * 0.12);
        break;
      case "line":
        for (let i = 0; i < n; i++)
          push(0.18 + (0.64 / Math.max(n - 1, 1)) * i, (0.5 - i / Math.max(n - 1, 1)) * 0.06, 0.3, "tech", i * 0.06);
        break;
      case "fountain":
        for (let i = 0; i < n; i++)
          push(0.5 + (rand() - 0.5) * 0.1, ((i - (n - 1) / 2) / n) * 0.24, 0.24 + rand() * 0.1, "tech", i * 0.1);
        break;
      case "spiral":
        for (let i = 0; i < n; i++)
          push(0.5 + Math.sin(i * 1.4) * 0.28, Math.cos(i * 1.4) * 0.09, 0.22 + i * 0.05, "tech", i * 0.16);
        break;
      case "snake":
        for (let i = 0; i < n; i++)
          push(0.15 + (0.7 / n) * i, 0.05, 0.26 + Math.sin(i * 1.1) * 0.1, "tech", i * 0.13);
        break;
      case "deploy":
        // aligned row at matched apex — the god-swipe invitation
        for (let i = 0; i < n; i++)
          push(0.12 + (0.76 / Math.max(n - 1, 1)) * i, 0, 0.3, "tech", i * 0.04);
        break;
      case "hourglass":
        push(0.5 + (rand() - 0.5) * 0.3, (rand() - 0.5) * 0.06, 0.26, "hourglass");
        break;
    }
    if (flags.includes("b")) push(0.35 + rand() * 0.3, (rand() - 0.5) * 0.1, 0.22, "bug", 0.25);
    if (flags.includes("m")) {
      const i = (rand() * orbs.length) | 0;
      if (orbs[i] && orbs[i].kind === "tech") orbs[i] = { ...orbs[i], kind: "mimic" };
    }
    evs.push({ at, slow: flags.includes("slow"), orbs });
  }
  return evs;
}
