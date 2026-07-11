"use client";

import { useEffect, useRef, useState } from "react";
import { site, glassFocus } from "@/lib/site";
import {
  ERAS, TECH, SERVICES, MONOLITH_AT, expandChart,
  type ChartEv, type Kind,
} from "./game-data";

/* ----------------------------------------------------------------------------
   MONOLITH BREAKER — full build (unlisted /breaker until approved).
   Arc: five career-era acts of choreographed volleys → the SOAP monolith
   descends → carve it into microservices → "SHIPPED TO PROD" → reverse-shatter
   into the contact card.

   Anti-Dig firewall (mechanics, not tuning): blade arms only on a fast stroke,
   combos decay, bugs/mimics reset the combo. All state in refs; one rAF loop;
   Canvas 2D; zero dependencies.
---------------------------------------------------------------------------- */

const BG0 = "#0b0c13";
const ARM_FRAC = 0.08;
const ARM_WINDOW = 150;
const TRAIL_TTL = 160;
const CHAIN_WINDOW = 170;
const COMBO_DECAY = 4000;
const BULLET_MS = 3000;
const DEPLOY_MS = 2000;

type Phase = "play" | "monolith" | "shipped" | "endcard";

type Orb = {
  x: number; y: number; vx: number; vy: number; r: number;
  kind: Kind; label: string; hue: number; spin: number; rot: number;
  sliced: boolean; born: number; revealed: boolean;
};
type Shard = { x: number; y: number; vx: number; vy: number; rot: number; vr: number; life: number; hue: number; pts: number[] };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; hue: number; calm?: boolean };
type Stamp = { text: string; x: number; y: number; life: number; big: boolean; mega?: boolean; sub?: string };
type Tile = { x: number; y: number; vy: number; rot: number; vr: number; life: number };
type TrailPt = { x: number; y: number; t: number };
type Trail = { pts: TrailPt[]; chain: number; lastSlice: number };
type Chunk = {
  quad: number[]; // x1,y1,x2,y2,x3,y3,x4,y4 at detach time
  cx: number; cy: number; vx: number; vy: number; rot: number; vr: number;
  t: number; // 0→1 morph to cube
  label: string; hue: number;
  dockAngle: number;
};
type Gather = { x: number; y: number; tx: number; ty: number; hue: number; d: number };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpHex = (h1: string, h2: string, t: number) => {
  const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16);
  const r = Math.round(lerp((a >> 16) & 255, (b >> 16) & 255, t));
  const g = Math.round(lerp((a >> 8) & 255, (b >> 8) & 255, t));
  const bl = Math.round(lerp(a & 255, b & 255, t));
  return `rgb(${r},${g},${bl})`;
};

export function BreakerPrototype() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hud, setHud] = useState({ score: 0, best: 0, combo: 0 });
  const [stack, setStack] = useState<string[]>([]);
  const [hintGone, setHintGone] = useState(false);
  const [superReady, setSuperReady] = useState(false);
  const [phaseUi, setPhaseUi] = useState<Phase>("play");
  const [finalStats, setFinalStats] = useState({ score: 0, maxCombo: 0, time: "0:00", stack: [] as string[] });
  const [runId, setRunId] = useState(0);
  const superFire = useRef<() => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setPhaseUi("play"); setStack([]); setHintGone(false); setSuperReady(false);

    let W = 0, H = 0, dpr = 1, minSide = 0;
    const resize = () => {
      W = window.innerWidth; H = window.innerHeight;
      minSide = Math.min(W, H);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    /* ---------- run state ---------- */
    const CHART: ChartEv[] = expandChart();
    let phase: Phase = "play";
    let gameT = 0; // scaled seconds — drives the chart
    const orbs: Orb[] = [];
    const shards: Shard[] = [];
    const sparks: Spark[] = [];
    const stamps: Stamp[] = [];
    const tiles: Tile[] = [];
    const chunks: Chunk[] = [];
    const docked: Chunk[] = [];
    const gathers: Gather[] = [];
    const pending: { at: number; spec: { xf: number; vxf: number; apex: number; kind: Kind } }[] = [];
    const trails = new Map<number, Trail>();
    let evIdx = 0;
    let score = 0, best = 0, combo = 0, maxCombo = 0, lastSliceAt = -1e9;
    let freezeUntil = 0, shake = 0, crackUntil = 0;
    let bulletUntil = 0, deployUntil = 0, timeScale = 1;
    let superMeter = 0, superBusy = false;
    let eraIdx = -1;
    let firstSlice = false;
    let runStart = performance.now();
    let monolith: {
      sx: number; sy: number; sw: number; sh: number;
      drop: number; // 0→1 descend
      seams: { ly: number; ry: number; cut: boolean }[];
      topIdx: number; // first uncut seam
      coreAlive: boolean; corePulse: number;
    } | null = null;
    let shippedAt = 0, gatherStart = 0;
    const stacked = new Set<string>();
    try { best = Number(localStorage.getItem("bw-breaker-hi") || 0); } catch {}

    /* ---------- audio ---------- */
    let ac: AudioContext | null = null;
    const ensureAudio = () => { if (!ac) { try { ac = new AudioContext(); } catch {} } };
    const blip = (f0: number, f1: number, dur: number, type: OscillatorType, vol: number, when = 0) => {
      if (!ac) return;
      if (ac.state !== "running") ac.resume?.().catch(() => {});
      try {
        const t = ac.currentTime + when;
        const o = ac.createOscillator(); const g = ac.createGain();
        o.type = type; o.frequency.setValueAtTime(Math.max(f0, 1), t);
        o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + dur);
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
      } catch {}
    };
    const sliceSound = (chain: number) => {
      blip(95, 55, 0.09, "sine", 0.5);
      const semis = Math.min(combo, 24) + (chain - 1) * 2;
      blip(523 * Math.pow(2, semis / 12), 523 * Math.pow(2, semis / 12), 0.16, "triangle", 0.22);
    };
    const crackSound = () => blip(220, 40, 0.25, "sawtooth", 0.3);
    const bulletSound = () => { blip(700, 180, 0.5, "sine", 0.22); blip(350, 90, 0.7, "sine", 0.12, 0.05); };
    const fanfare = () => [0, 4, 7, 12].forEach((s, i) => blip(392 * Math.pow(2, s / 12), 392 * Math.pow(2, s / 12), 0.18, "triangle", 0.22, i * 0.07));
    const seamSound = () => { blip(160, 42, 0.3, "sawtooth", 0.4); blip(90, 50, 0.12, "sine", 0.5); };
    const boomSound = () => { blip(75, 28, 0.9, "sine", 0.7); blip(140, 30, 0.5, "sawtooth", 0.3, 0.02); blip(1046, 523, 0.5, "triangle", 0.18, 0.1); };

    /* ---------- spawning ---------- */
    const spawnOrb = (spec: { xf: number; vxf: number; apex: number; kind: Kind }) => {
      const r = Math.max(26, minSide * 0.052);
      const g = H * 0.95;
      const apexY = H * spec.apex;
      const vy = -Math.sqrt(2 * g * Math.max(H - apexY, 50));
      let label: string, hue: number;
      if (spec.kind === "logo") { label = "BW"; hue = 250; }
      else if (spec.kind === "bug") { label = "BUG"; hue = 0; }
      else if (spec.kind === "hourglass") { label = "⏳"; hue = 258; }
      else { const p = TECH[(Math.random() * TECH.length) | 0]; label = p[0]; hue = p[1]; }
      orbs.push({
        x: spec.xf * W, y: H + r + 4, vx: spec.vxf * W, vy: vy * (0.97 + Math.random() * 0.05),
        r: spec.kind === "hourglass" ? r * 1.25 : r,
        kind: spec.kind, label, hue, spin: (Math.random() - 0.5) * 2, rot: 0,
        sliced: false, born: gameT, revealed: spec.kind !== "mimic",
      });
    };
    const scheduleEv = (ev: ChartEv) => {
      for (const o of ev.orbs) pending.push({ at: gameT + o.delay, spec: o });
      if (ev.slow && !reduce) deployUntil = performance.now() + DEPLOY_MS;
    };

    /* ---------- fx ---------- */
    const addStamp = (text: string, x: number, y: number, big = false, mega = false, sub?: string) =>
      stamps.push({ text, x, y, life: 1, big, mega, sub });
    const burst = (x: number, y: number, r: number, hue: number, vel: { x: number; y: number }, ang: number, n: number) => {
      for (let i = 0; i < n; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const sp = 90 + Math.random() * 240;
        const a = ang + (Math.PI / 2) * side + (Math.random() - 0.5) * 0.9;
        const pts: number[] = [];
        const m = 3 + ((Math.random() * 3) | 0);
        for (let k = 0; k < m; k++) {
          const rr = r * (0.18 + Math.random() * 0.4);
          const aa = (k / m) * Math.PI * 2;
          pts.push(Math.cos(aa) * rr, Math.sin(aa) * rr);
        }
        shards.push({ x, y, vx: Math.cos(a) * sp + vel.x * 0.35, vy: Math.sin(a) * sp + vel.y * 0.25, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 10, life: 1, hue, pts });
      }
      if (shards.length > 320) shards.splice(0, shards.length - 320);
    };

    /* ---------- slicing ---------- */
    const creditSlice = (o: Orb, chain: number, now: number) => {
      combo += 1;
      maxCombo = Math.max(maxCombo, combo);
      lastSliceAt = now;
      const mult = 1 + Math.min(combo, 40) * 0.1;
      const bonus = o.kind === "hourglass" ? 150 : o.kind === "logo" ? 50 : 0;
      const gain = Math.round(25 * chain * mult) + bonus;
      score += gain;
      if (score > best) { best = score; try { localStorage.setItem("bw-breaker-hi", String(best)); } catch {} }
      superMeter = Math.min(superMeter + 0.045 + (chain - 1) * 0.02, 1);
      addStamp(`+${gain}`, o.x + o.r * 0.7, o.y + o.r * 0.4, false);
      if (o.kind === "tech" && !stacked.has(o.label)) { stacked.add(o.label); setStack([...stacked]); }
    };
    const doSlice = (o: Orb, trail: Trail, ang: number, now: number) => {
      o.sliced = true;
      const chained = now - trail.lastSlice <= CHAIN_WINDOW;
      trail.chain = chained ? trail.chain + 1 : 1;
      trail.lastSlice = now;
      if (o.kind === "bug" || o.kind === "mimic") {
        combo = 0; superMeter = Math.max(superMeter - 0.15, 0);
        crackUntil = now + 500; shake = reduce ? 0 : 14;
        crackSound();
        try { navigator.vibrate?.(45); } catch {}
        addStamp(o.kind === "mimic" ? "MIMIC!" : "COMBO LOST", o.x, o.y, false);
        burst(o.x, o.y, o.r, 0, { x: o.vx, y: o.vy }, ang, reduce ? 5 : 10);
        return;
      }
      creditSlice(o, trail.chain, now);
      freezeUntil = now + (reduce ? 15 : 60);
      shake = reduce ? 0 : Math.min(4 + trail.chain * 2.5, 18);
      sliceSound(trail.chain);
      try { navigator.vibrate?.(trail.chain > 1 ? [12, 25, 14] : 9); } catch {}
      burst(o.x, o.y, o.r, o.hue, { x: o.vx, y: o.vy }, ang, reduce ? 6 : 12);
      if (!firstSlice) { firstSlice = true; setHintGone(true); }
      if (trail.chain >= 2) addStamp(`x${trail.chain}`, o.x, o.y - o.r, true);
      if (o.kind === "hourglass" && !reduce) {
        bulletUntil = now + BULLET_MS;
        bulletSound();
        addStamp("GLASSFOCUS", W / 2, H * 0.3, true, false, "deep focus · 3s");
        for (let i = 0; i < 26; i++)
          sparks.push({ x: o.x, y: o.y, vx: (Math.random() - 0.5) * 50, vy: (Math.random() - 0.5) * 50, life: 2.2, hue: 258, calm: true });
      } else if (o.kind === "hourglass") {
        addStamp("GLASSFOCUS", W / 2, H * 0.3, true);
      }
    };

    /* ---------- ToolsDeck super ---------- */
    const fireSuper = () => {
      if (superMeter < 1 || superBusy || phase !== "play") return;
      superBusy = true; superMeter = 0; setSuperReady(false);
      fanfare();
      addStamp("102 TOOLS", W / 2, H * 0.34, true, true, "toolsdeck barrage");
      const n = reduce ? 30 : 102;
      for (let i = 0; i < n; i++)
        tiles.push({ x: Math.random() * W, y: -20 - Math.random() * H * 0.6, vy: H * (0.9 + Math.random() * 0.8), rot: Math.random() * 6, vr: (Math.random() - 0.5) * 8, life: 1.6 });
      const targets = orbs.filter((o) => !o.sliced);
      targets.forEach((o, i) => {
        setTimeout(() => {
          if (o.sliced || phase !== "play") return;
          o.sliced = true;
          if (o.kind === "bug" || o.kind === "mimic") {
            burst(o.x, o.y, o.r, 0, { x: o.vx, y: o.vy }, Math.random() * 6, 8); // super deletes bugs free
          } else {
            creditSlice(o, 1, performance.now());
            burst(o.x, o.y, o.r, o.hue, { x: o.vx, y: o.vy }, Math.random() * 6, 8);
            blip(700 + i * 60, 700 + i * 60, 0.08, "triangle", 0.12);
          }
        }, 60 + i * 45);
      });
      setTimeout(() => { superBusy = false; }, 60 + targets.length * 45 + 200);
      try { navigator.vibrate?.([20, 30, 20, 30, 40]); } catch {}
    };
    superFire.current = fireSuper;

    /* ---------- monolith ---------- */
    const startMonolith = () => {
      phase = "monolith"; setPhaseUi("monolith");
      const sw = Math.min(W * (W < 640 ? 0.7 : 0.44), 520);
      const sh = H * 0.78;
      const sx = W / 2 - sw / 2, sy = H / 2 - sh / 2 + H * 0.02;
      const seams = SERVICES.map((_, i) => {
        const f = 0.13 + i * 0.135;
        const j = (i % 2 === 0 ? -1 : 1) * sh * 0.02;
        return { ly: sy + sh * f - j, ry: sy + sh * f + j, cut: false };
      });
      monolith = { sx, sy, sw, sh, drop: 0, seams, topIdx: 0, coreAlive: true, corePulse: 0 };
      addStamp("THE LEGACY MONOLITH", W / 2, H * 0.16, true, true, "carve it into microservices — follow the glowing seam");
      blip(60, 35, 1.2, "sine", 0.5);
    };
    const cutSeam = (i: number, now: number) => {
      const m = monolith!;
      m.seams[i].cut = true;
      const topL = i === 0 ? m.sy : m.seams[i - 1].ly;
      const topR = i === 0 ? m.sy : m.seams[i - 1].ry;
      const s = m.seams[i];
      const quad = [m.sx, topL, m.sx + m.sw, topR, m.sx + m.sw, s.ry, m.sx, s.ly];
      const cx = m.sx + m.sw / 2, cy = (topL + topR + s.ly + s.ry) / 4;
      const dir = i % 2 === 0 ? 1 : -1;
      chunks.push({
        quad, cx, cy, vx: dir * (140 + Math.random() * 60), vy: -60, rot: 0, vr: dir * 0.9,
        t: 0, label: SERVICES[i], hue: TECH[i % TECH.length][1],
        dockAngle: -Math.PI / 2 + (i - (SERVICES.length - 1) / 2) * 0.42,
      });
      m.topIdx = i + 1;
      seamSound();
      shake = reduce ? 0 : 12;
      freezeUntil = now + (reduce ? 15 : 50);
      score += 200; if (score > best) { best = score; try { localStorage.setItem("bw-breaker-hi", String(best)); } catch {} }
      addStamp(SERVICES[i], cx, cy, true, false, "service extracted · +200");
      try { navigator.vibrate?.(30); } catch {}
    };
    const shatterCore = (now: number) => {
      const m = monolith!;
      m.coreAlive = false;
      boomSound();
      shake = reduce ? 4 : 26;
      freezeUntil = now + (reduce ? 30 : 140);
      const topL = m.seams[m.seams.length - 1].ly, topR = m.seams[m.seams.length - 1].ry;
      for (let i = 0; i < (reduce ? 24 : 60); i++) {
        const x = m.sx + Math.random() * m.sw;
        const y = topL + Math.random() * (m.sy + m.sh - topL);
        burst(x, y, 26, 210, { x: 0, y: 0 }, Math.random() * 6.28, 1);
      }
      score += 500; if (score > best) { best = score; try { localStorage.setItem("bw-breaker-hi", String(best)); } catch {} }
      addStamp("SHIPPED TO PROD", W / 2, H * 0.42, true, true, `+500 · ${docked.length + chunks.length} services extracted`);
      try { navigator.vibrate?.([40, 60, 80]); } catch {}
      phase = "shipped"; setPhaseUi("shipped");
      shippedAt = now;
    };
    const beginGather = (now: number) => {
      gatherStart = now;
      const n = reduce ? 120 : 380;
      const cw = Math.min(W * 0.86, 430), ch = Math.min(H * 0.6, 380);
      for (let i = 0; i < n; i++) {
        const edge = (Math.random() * 4) | 0;
        const x = edge === 0 ? -20 : edge === 1 ? W + 20 : Math.random() * W;
        const y = edge === 2 ? -20 : edge === 3 ? H + 20 : Math.random() * H;
        gathers.push({
          x, y,
          tx: W / 2 + (Math.random() - 0.5) * cw,
          ty: H / 2 + (Math.random() - 0.5) * ch,
          hue: [24, 130, 190, 210, 258][(Math.random() * 5) | 0],
          d: Math.random() * 0.5,
        });
      }
    };

    /* ---------- input ---------- */
    const armLen = () => minSide * ARM_FRAC;
    const trailFor = (id: number) => {
      let t = trails.get(id);
      if (!t) { t = { pts: [], chain: 0, lastSlice: -1e9 }; trails.set(id, t); }
      return t;
    };
    const isArmed = (t: Trail, now: number) => {
      let d = 0;
      for (let i = t.pts.length - 1; i > 0; i--) {
        const a = t.pts[i], b = t.pts[i - 1];
        if (now - b.t > ARM_WINDOW) break;
        d += Math.hypot(a.x - b.x, a.y - b.y);
        if (d >= armLen()) return true;
      }
      return false;
    };
    const segHitsOrb = (a: TrailPt, b: TrailPt, o: Orb) => {
      const dx = b.x - a.x, dy = b.y - a.y;
      const l2 = dx * dx + dy * dy;
      if (l2 === 0) return false;
      let s = ((o.x - a.x) * dx + (o.y - a.y) * dy) / l2;
      s = Math.max(0, Math.min(1, s));
      const px = a.x + s * dx - o.x, py = a.y + s * dy - o.y;
      return px * px + py * py <= o.r * o.r;
    };
    const segCrossesSeam = (a: TrailPt, b: TrailPt, x1: number, y1: number, x2: number, y2: number) => {
      const d = (b.x - a.x) * (y2 - y1) - (b.y - a.y) * (x2 - x1);
      if (Math.abs(d) < 1e-9) return false;
      const t = ((x1 - a.x) * (y2 - y1) - (y1 - a.y) * (x2 - x1)) / d;
      const u = ((x1 - a.x) * (b.y - a.y) - (y1 - a.y) * (b.x - a.x)) / d;
      return t >= 0 && t <= 1 && u >= 0 && u <= 1;
    };
    const strokeLen = (t: Trail, now: number, windowMs: number) => {
      let d = 0;
      for (let i = t.pts.length - 1; i > 0; i--) {
        const a = t.pts[i], b = t.pts[i - 1];
        if (now - b.t > windowMs) break;
        d += Math.hypot(a.x - b.x, a.y - b.y);
      }
      return d;
    };

    const onPointerDown = (e: PointerEvent) => {
      ensureAudio();
      trailFor(e.pointerId).pts.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    };
    const probe = { moves: 0, hasPrev: 0, armed: 0, hits: 0 };
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.buttons === 0) return;
      if (phase === "shipped" || phase === "endcard") return;
      probe.moves++;
      const now = performance.now();
      const t = trailFor(e.pointerId);
      const prev = t.pts[t.pts.length - 1];
      const cur = { x: e.clientX, y: e.clientY, t: now };
      t.pts.push(cur);
      if (t.pts.length > 48) t.pts.shift();
      if (prev && !reduce)
        sparks.push({ x: cur.x, y: cur.y, vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60 - 30, life: 1, hue: 210 + Math.random() * 80 });
      if (!prev || !isArmed(t, now)) return;
      if (prev) probe.hasPrev++;
      probe.armed++;
      const ang = Math.atan2(cur.y - prev.y, cur.x - prev.x);

      if (phase === "play") {
        for (const o of orbs) if (!o.sliced && segHitsOrb(prev, cur, o)) { probe.hits++; doSlice(o, t, ang, now); }
      } else if (phase === "monolith" && monolith && monolith.drop >= 1) {
        const m = monolith;
        if (m.topIdx < m.seams.length) {
          const s = m.seams[m.topIdx];
          if (segCrossesSeam(prev, cur, m.sx, s.ly, m.sx + m.sw, s.ry)) cutSeam(m.topIdx, now);
          else if (cur.x > m.sx && cur.x < m.sx + m.sw && cur.y > m.sy && cur.y < m.sy + m.sh) {
            // sparking off the wrong spot — reglow, no penalty
            if (!reduce) for (let i = 0; i < 2; i++)
              sparks.push({ x: cur.x, y: cur.y, vx: (Math.random() - 0.5) * 120, vy: -Math.random() * 80, life: 0.7, hue: 40 });
          }
        } else if (m.coreAlive) {
          const coreTop = Math.min(m.seams[m.seams.length - 1].ly, m.seams[m.seams.length - 1].ry);
          const inCore = cur.y > coreTop && cur.x > m.sx && cur.x < m.sx + m.sw;
          if (inCore && strokeLen(t, now, 320) > Math.hypot(W, H) * 0.35) shatterCore(now);
          else if (inCore && !reduce)
            sparks.push({ x: cur.x, y: cur.y, vx: (Math.random() - 0.5) * 140, vy: -Math.random() * 90, life: 0.8, hue: 0 });
        }
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      const t = trails.get(e.pointerId);
      if (t && e.pointerType !== "mouse") trails.delete(e.pointerId);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key.toLowerCase() === "t") fireSuper(); };
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("keydown", onKey);

    /* ---------- drawing ---------- */
    const drawOrb = (o: Orb, now: number) => {
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(o.rot);
      const hostile = (o.kind === "bug") || (o.kind === "mimic" && o.revealed);
      if (hostile) {
        ctx.fillStyle = "rgba(255,45,70,0.16)";
        ctx.strokeStyle = "rgba(255,60,80,0.95)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          const rr = i % 2 === 0 ? o.r : o.r * 0.72;
          ctx[i === 0 ? "moveTo" : "lineTo"](Math.cos(a) * rr, Math.sin(a) * rr);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "rgba(255,120,130,1)";
        ctx.font = `700 ${o.r * 0.42}px ui-monospace, monospace`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("BUG", 0, 1);
      } else {
        const glitch = o.kind === "mimic" && Math.sin(now / 42) > 0.72; // disguise shimmer
        const hue = o.kind === "hourglass" ? 258 : o.hue;
        const grad = ctx.createRadialGradient(-o.r * 0.35, -o.r * 0.4, o.r * 0.1, 0, 0, o.r);
        grad.addColorStop(0, `hsla(${hue}, 85%, ${glitch ? 60 : 72}%, 0.95)`);
        grad.addColorStop(0.55, `hsla(${glitch ? 0 : hue}, 70%, 45%, 0.85)`);
        grad.addColorStop(1, `hsla(${hue}, 70%, 22%, 0.9)`);
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, 0, o.r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, 0, o.r - 1, -2.4, -0.6); ctx.stroke();
        ctx.strokeStyle = o.kind === "hourglass" ? "rgba(196,181,253,0.7)" : "rgba(255,255,255,0.14)";
        ctx.beginPath(); ctx.arc(0, 0, o.r - 1, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.font = `700 ${o.r * (o.label.length > 4 ? 0.34 : 0.42)}px ui-sans-serif, system-ui`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(o.label, 0, 1);
      }
      ctx.restore();
    };

    const drawTrails = (now: number) => {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const t of trails.values()) {
        const pts = t.pts.filter((p) => now - p.t < TRAIL_TTL);
        if (pts.length < 2) continue;
        const armed = isArmed(t, now);
        const w = (armed ? 7 : 3.5) + Math.min(combo, 30) * 0.12;
        for (const [off, color] of [[-1.6, "rgba(80,200,255,0.5)"], [1.6, "rgba(255,90,200,0.5)"]] as const) {
          ctx.strokeStyle = color; ctx.lineWidth = w * 0.9; ctx.lineCap = "round"; ctx.lineJoin = "round";
          ctx.beginPath();
          pts.forEach((p, i) => ctx[i ? "lineTo" : "moveTo"](p.x + off, p.y + off));
          ctx.stroke();
        }
        ctx.strokeStyle = armed ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.45)";
        ctx.lineWidth = w * 0.55;
        ctx.beginPath();
        pts.forEach((p, i) => ctx[i ? "lineTo" : "moveTo"](p.x, p.y));
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawMonolith = (now: number) => {
      const m = monolith!;
      const yOff = (1 - m.drop) * -(m.sy + m.sh);
      ctx.save();
      ctx.translate(0, yOff);
      const topSeam = m.topIdx === 0 ? null : m.seams[m.topIdx - 1];
      const topL = topSeam ? topSeam.ly : m.sy;
      const topR = topSeam ? topSeam.ry : m.sy;
      // slab body
      const grad = ctx.createLinearGradient(m.sx, 0, m.sx + m.sw, 0);
      grad.addColorStop(0, "#3a3d44"); grad.addColorStop(0.5, "#2b2d33"); grad.addColorStop(1, "#1f2126");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(m.sx, topL); ctx.lineTo(m.sx + m.sw, topR);
      ctx.lineTo(m.sx + m.sw, m.sy + m.sh); ctx.lineTo(m.sx, m.sy + m.sh);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 2; ctx.stroke();
      // etched SOAP + scribbles
      ctx.save();
      ctx.clip();
      ctx.fillStyle = "rgba(255,255,255,0.07)";
      ctx.font = `800 ${m.sw * 0.34}px ui-sans-serif, system-ui`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.save();
      ctx.translate(m.sx + m.sw / 2, (Math.max(topL, m.sy) + m.sy + m.sh) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("S O A P", 0, 0);
      ctx.restore();
      ctx.fillStyle = "rgba(255,255,255,0.045)";
      ctx.font = `500 11px ui-monospace, monospace`;
      ctx.textAlign = "left";
      for (let i = 0; i < 14; i++) {
        const y = m.sy + 30 + i * (m.sh / 15);
        if (y > topL - 8) ctx.fillText("<soap:Envelope xmlns:soap=…><wsdl:port binding=…>", m.sx + 12, y);
      }
      ctx.restore();
      // active ghost seam (AI assist)
      if (m.topIdx < m.seams.length && m.drop >= 1) {
        const s = m.seams[m.topIdx];
        const pulse = 0.5 + 0.5 * Math.sin(now / 260);
        ctx.save();
        ctx.setLineDash([10, 9]);
        ctx.lineDashOffset = -now / 28;
        ctx.strokeStyle = `rgba(129,212,250,${0.45 + pulse * 0.5})`;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(m.sx - 14, s.ly); ctx.lineTo(m.sx + m.sw + 14, s.ry); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = `rgba(129,212,250,${0.5 + pulse * 0.4})`;
        ctx.font = "600 11px ui-monospace, monospace";
        ctx.textAlign = "left";
        ctx.fillText("⌁ AI: cut here", m.sx + m.sw + 20, s.ry + 4);
        ctx.restore();
      }
      // core pulse
      if (m.topIdx >= m.seams.length && m.coreAlive) {
        m.corePulse = 0.5 + 0.5 * Math.sin(now / 200);
        const s = m.seams[m.seams.length - 1];
        ctx.save();
        ctx.strokeStyle = `rgba(255,90,90,${0.4 + m.corePulse * 0.5})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(m.sx, s.ly); ctx.lineTo(m.sx + m.sw, s.ry);
        ctx.lineTo(m.sx + m.sw, m.sy + m.sh); ctx.lineTo(m.sx, m.sy + m.sh);
        ctx.closePath(); ctx.stroke();
        ctx.fillStyle = `rgba(255,120,120,${0.6 + m.corePulse * 0.4})`;
        ctx.font = "700 13px ui-monospace, monospace";
        ctx.textAlign = "center";
        ctx.fillText("THE CORE — one full-screen swipe", m.sx + m.sw / 2, m.sy + m.sh + 24);
        ctx.restore();
      }
      ctx.restore();
    };

    const drawChunk = (c: Chunk) => {
      ctx.save();
      if (c.t < 0.55) {
        // rigid slab piece flying
        ctx.translate(c.cx, c.cy); ctx.rotate(c.rot);
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#33363d";
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.beginPath();
        const q = c.quad;
        ctx.moveTo(q[0] - c.cx, q[1] - c.cy);
        for (let i = 2; i < 8; i += 2) ctx.lineTo(q[i] - c.cx, q[i + 1] - c.cy);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      } else {
        // glass microservice cube
        const k = Math.min((c.t - 0.55) / 0.45, 1);
        const size = lerp(90, 62, k);
        ctx.translate(c.cx, c.cy); ctx.rotate(c.rot * (1 - k));
        ctx.globalAlpha = 1;
        const g2 = ctx.createLinearGradient(-size / 2, -size / 2, size / 2, size / 2);
        g2.addColorStop(0, `hsla(${c.hue}, 70%, 60%, 0.35)`);
        g2.addColorStop(1, `hsla(${c.hue}, 70%, 35%, 0.25)`);
        ctx.fillStyle = g2;
        ctx.strokeStyle = `hsla(${c.hue}, 80%, 70%, 0.9)`;
        ctx.lineWidth = 1.5;
        const rr = 10;
        ctx.beginPath();
        ctx.roundRect(-size / 2, -size / 3, size, (size * 2) / 3, rr);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.font = `700 ${Math.max(11, size * 0.17)}px ui-monospace, monospace`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(c.label, 0, 0);
      }
      ctx.restore();
    };

    /* ---------- main loop ---------- */
    let last = performance.now();
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      let rdt = Math.min((now - last) / 1000, 0.032);
      last = now;
      if (document.hidden) return;
      if (now < freezeUntil) rdt = 0;
      // time scale: bullet-time > deploy window > normal
      const targetScale = now < bulletUntil ? 0.35 : now < deployUntil ? 0.55 : 1;
      timeScale = lerp(timeScale, targetScale, 0.12);
      const dt = rdt * timeScale;
      if (phase === "play") gameT += dt;

      /* spawn from chart */
      if (phase === "play") {
        while (evIdx < CHART.length && gameT >= CHART[evIdx].at) { scheduleEv(CHART[evIdx]); evIdx++; }
        for (let i = pending.length - 1; i >= 0; i--) {
          if (gameT >= pending[i].at) { spawnOrb(pending[i].spec); pending.splice(i, 1); }
        }
        if (gameT >= MONOLITH_AT && orbs.length === 0 && pending.length === 0 && !superBusy) startMonolith();
      }
      if (phase === "monolith" && monolith && monolith.drop < 1) {
        monolith.drop = Math.min(monolith.drop + rdt / 2.2, 1);
        if (!reduce) shake = Math.max(shake, 2.2);
        if (monolith.drop >= 1) addStamp("⌁ trace the glowing seam", W / 2, H * 0.1, false);
      }
      if (phase === "shipped" && now - shippedAt > 1300 && gathers.length === 0) beginGather(now);
      if (phase === "shipped" && gathers.length > 0 && now - gatherStart > 1500) {
        phase = "endcard";
        const ms = now - runStart;
        const mm = Math.floor(ms / 60000), ss = Math.round((ms % 60000) / 1000);
        setFinalStats({ score, maxCombo, time: `${mm}:${String(ss).padStart(2, "0")}`, stack: [...stacked] });
        setPhaseUi("endcard");
      }

      /* combo decay */
      if (combo > 0 && now - lastSliceAt > COMBO_DECAY) combo = 0;

      /* physics */
      const g = H * 0.95;
      for (const o of orbs) {
        o.x += o.vx * dt; o.y += o.vy * dt; o.vy += g * dt; o.rot += o.spin * dt;
        if (o.kind === "mimic" && !o.revealed && o.vy > -40) o.revealed = true; // flush at apex
      }
      for (let i = orbs.length - 1; i >= 0; i--)
        if (orbs[i].sliced || orbs[i].y > H + orbs[i].r * 2 + 40) orbs.splice(i, 1);
      for (let i = shards.length - 1; i >= 0; i--) {
        const s = shards[i];
        s.x += s.vx * rdt; s.y += s.vy * rdt; s.vy += g * 0.8 * rdt; s.rot += s.vr * rdt; s.life -= rdt * 1.4;
        if (s.life <= 0) shards.splice(i, 1);
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        const f = s.calm ? 0.25 : 1;
        s.x += s.vx * rdt * f; s.y += s.vy * rdt * f; s.vy += (s.calm ? 20 : 220) * rdt; s.life -= rdt * (s.calm ? 0.7 : 2.6);
        if (s.life <= 0) sparks.splice(i, 1);
      }
      for (let i = stamps.length - 1; i >= 0; i--) {
        const s = stamps[i];
        s.y -= (s.mega ? 12 : 42) * rdt; s.life -= rdt * (s.mega ? 0.5 : s.big ? 0.9 : 1.4);
        if (s.life <= 0) stamps.splice(i, 1);
      }
      for (let i = tiles.length - 1; i >= 0; i--) {
        const tl = tiles[i];
        tl.y += tl.vy * rdt; tl.rot += tl.vr * rdt; tl.life -= rdt;
        if (tl.life <= 0 || tl.y > H + 30) tiles.splice(i, 1);
      }
      for (let i = chunks.length - 1; i >= 0; i--) {
        const c = chunks[i];
        c.t = Math.min(c.t + rdt / 1.4, 1);
        if (c.t < 0.55) {
          c.cx += c.vx * rdt; c.cy += c.vy * rdt; c.vy += 60 * rdt; c.rot += c.vr * rdt;
        } else {
          const k = (c.t - 0.55) / 0.45;
          const R = minSide * 0.4;
          const tx = W / 2 + Math.cos(c.dockAngle) * R;
          const ty = H / 2 + Math.sin(c.dockAngle) * R * 0.8;
          c.cx = lerp(c.cx, tx, Math.min(k * 0.14 + 0.02, 1));
          c.cy = lerp(c.cy, ty, Math.min(k * 0.14 + 0.02, 1));
        }
        if (c.t >= 1) { docked.push(c); chunks.splice(i, 1); }
      }
      for (const d of docked) d.dockAngle += rdt * 0.1; // slow orbit
      for (const d of docked) {
        const R = minSide * 0.4;
        d.cx = W / 2 + Math.cos(d.dockAngle) * R;
        d.cy = H / 2 + Math.sin(d.dockAngle) * R * 0.8;
      }
      for (const gp of gathers) {
        const k = Math.max(0, Math.min((now - gatherStart) / 1000 - gp.d, 1));
        const e = k * k * (3 - 2 * k);
        gp.x = lerp(gp.x, gp.tx, e * 0.2 + 0.02);
        gp.y = lerp(gp.y, gp.ty, e * 0.2 + 0.02);
      }
      for (const t of trails.values())
        while (t.pts.length && now - t.pts[0].t > TRAIL_TTL * 2) t.pts.shift();

      /* super-ready flag → HUD */
      if (superMeter >= 1 && !superBusy && phase === "play") setSuperReady(true);

      /* ---------- draw ---------- */
      ctx.save();
      shake *= 0.88;
      if (shake > 0.3) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);

      // era background crossfade
      let e0 = 0;
      for (let i = 0; i < ERAS.length; i++) if (gameT >= ERAS[i].start) e0 = i;
      if (e0 !== eraIdx && phase === "play") {
        eraIdx = e0;
        const era = ERAS[e0];
        addStamp(era.label, W / 2, H * 0.2, true, true, era.sub);
      }
      const era = ERAS[Math.max(eraIdx, 0)];
      const nxt = ERAS[Math.min(Math.max(eraIdx, 0) + 1, ERAS.length - 1)];
      const span = Math.max(nxt.start - era.start, 1);
      const fade = phase === "play" ? Math.min(Math.max((gameT - era.start) / span, 0), 1) * 0.25 : 0;
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, lerpHex(era.bg[0], nxt.bg[0], fade));
      bgGrad.addColorStop(1, lerpHex(era.bg[1], nxt.bg[1], fade));
      ctx.fillStyle = phase === "play" || phase === "monolith" ? bgGrad : BG0;
      ctx.fillRect(-28, -28, W + 56, H + 56);
      const glow = ctx.createRadialGradient(W / 2, H * 0.05, 0, W / 2, H * 0.05, minSide * 0.8);
      glow.addColorStop(0, era.glow); glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(-28, -28, W + 56, H + 56);
      const vg = ctx.createRadialGradient(W / 2, H / 2, minSide * 0.3, W / 2, H / 2, minSide * 0.85);
      vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.45)");
      ctx.fillStyle = vg; ctx.fillRect(-28, -28, W + 56, H + 56);

      // bullet-time tint
      if (now < bulletUntil) {
        ctx.fillStyle = "rgba(140,120,255,0.06)";
        ctx.fillRect(-28, -28, W + 56, H + 56);
      }

      if (phase === "monolith" || phase === "shipped") { if (monolith) drawMonolith(now); }
      for (const c of chunks) drawChunk(c);
      for (const d of docked) drawChunk(d);

      for (const s of shards) {
        ctx.save();
        ctx.translate(s.x, s.y); ctx.rotate(s.rot);
        ctx.globalAlpha = Math.max(s.life, 0);
        ctx.fillStyle = `hsla(${s.hue}, 80%, 62%, 0.9)`;
        ctx.beginPath();
        for (let k = 0; k < s.pts.length; k += 2) ctx[k === 0 ? "moveTo" : "lineTo"](s.pts[k], s.pts[k + 1]);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      if (phase === "play") for (const o of orbs) drawOrb(o, now);
      // tiles (super barrage)
      for (const tl of tiles) {
        ctx.save();
        ctx.translate(tl.x, tl.y); ctx.rotate(tl.rot);
        ctx.globalAlpha = Math.min(tl.life, 1) * 0.9;
        ctx.fillStyle = "#6ea8fe";
        ctx.beginPath(); ctx.roundRect(-6, -6, 12, 12, 3); ctx.fill();
        ctx.fillStyle = "#070a12";
        ctx.fillRect(-3.5, -3.5, 3, 3); ctx.fillRect(0.5, -3.5, 3, 3);
        ctx.fillRect(-3.5, 0.5, 3, 3); ctx.fillRect(0.5, 0.5, 3, 3);
        ctx.restore();
      }
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const s of sparks) {
        ctx.globalAlpha = Math.max(s.life, 0) * 0.85;
        ctx.fillStyle = `hsla(${s.hue}, 90%, 70%, 1)`;
        ctx.fillRect(s.x - 1.4, s.y - 1.4, 2.8, 2.8);
      }
      for (const gp of gathers) {
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = `hsla(${gp.hue}, 80%, 65%, 1)`;
        ctx.fillRect(gp.x - 1.6, gp.y - 1.6, 3.2, 3.2);
      }
      ctx.restore();
      drawTrails(now);
      for (const s of stamps) {
        ctx.save();
        ctx.globalAlpha = Math.min(s.life * 1.6, 1);
        ctx.fillStyle = s.mega ? "#ffe9a8" : s.big ? "#ffe9a8" : "rgba(255,255,255,0.9)";
        ctx.font = `800 ${s.mega ? Math.min(44, W * 0.055) : s.big ? 30 : 16}px ui-sans-serif, system-ui`;
        ctx.textAlign = "center";
        ctx.fillText(s.text, s.x, s.y);
        if (s.sub) {
          ctx.fillStyle = "rgba(255,255,255,0.65)";
          ctx.font = "500 13px ui-monospace, monospace";
          ctx.fillText(s.sub, s.x, s.y + (s.mega ? 30 : 24));
        }
        ctx.restore();
      }
      // super meter (thin arc bottom-right anchor drawn by HTML button; meter bar here)
      if (phase === "play") {
        ctx.save();
        ctx.globalAlpha = 0.9;
        const bw = Math.min(W * 0.3, 220);
        const bx = W - bw - 20, by = H - 26;
        ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.beginPath(); ctx.roundRect(bx, by, bw, 6, 3); ctx.fill();
        ctx.fillStyle = superMeter >= 1 ? "#6ea8fe" : "rgba(110,168,254,0.55)";
        ctx.beginPath(); ctx.roundRect(bx, by, bw * superMeter, 6, 3); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.font = "600 10px ui-monospace, monospace";
        ctx.textAlign = "right";
        ctx.fillText(superMeter >= 1 ? "TOOLSDECK READY — tap ⊞ or press T" : "toolsdeck charge", bx + bw, by - 6);
        ctx.restore();
      }
      // crack overlay
      if (now < crackUntil) {
        ctx.save();
        ctx.globalAlpha = ((crackUntil - now) / 500) * 0.5;
        ctx.fillStyle = "rgba(255,30,50,1)";
        ctx.fillRect(-28, -28, W + 56, H + 56);
        ctx.restore();
      }
      ctx.restore();
    };
    raf = requestAnimationFrame(loop);

    // Debug/verification hook: jump the run to a chart time (or the monolith).
    (window as unknown as { __mb?: object }).__mb = {
      seek: (t: number) => {
        gameT = t;
        while (evIdx < CHART.length && CHART[evIdx].at < t) evIdx++;
      },
      toMonolith: () => {
        gameT = MONOLITH_AT;
        evIdx = CHART.length;
        pending.length = 0;
        for (const o of orbs) o.sliced = true;
      },
      chargeSuper: () => { superMeter = 1; },
      toEndcard: () => {
        phase = "endcard";
        setFinalStats({ score, maxCombo, time: "0:42", stack: [...stacked] });
        setPhaseUi("endcard");
      },
      state: () => ({ phase, gameT: Math.round(gameT), orbs: orbs.length, score, combo, superMeter, probe: { ...probe } }),
      orbs: () => orbs.filter((o) => !o.sliced).map((o) => ({ x: Math.round(o.x), y: Math.round(o.y), r: Math.round(o.r), kind: o.kind })),
      monolith: () => monolith && { sx: monolith.sx, sw: monolith.sw, drop: monolith.drop, topIdx: monolith.topIdx, coreAlive: monolith.coreAlive, seams: monolith.seams.map(s => ({ ly: Math.round(s.ly), ry: Math.round(s.ry), cut: s.cut })) },
    };

    const hudTimer = setInterval(() => {
      setHud((h) => (h.score === score && h.best === best && h.combo === combo ? h : { score, best, combo }));
    }, 150);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(hudTimer);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("keydown", onKey);
      ac?.close?.().catch(() => {});
    };
  }, [runId]);

  return (
    <div
      // While playing, the blade IS the cursor. Once the run is shipped and
      // the contact card is up, bring back the site's custom cursor + trail.
      data-no-cursor={phaseUi === "endcard" ? undefined : ""}
      className="fixed inset-0 z-[300] select-none"
      style={{ background: BG0 }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 touch-none" />

      {/* HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
        <div>
          <a
            href="/"
            className="pointer-events-auto rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10"
          >
            ← skim the résumé
          </a>
          <p className="mt-3 font-mono text-2xl font-bold text-white">{hud.score}</p>
          <p className="font-mono text-[11px] text-white/40">best {hud.best}</p>
        </div>
        <div className="text-right">
          {hud.combo >= 2 ? (
            <p className="font-mono text-lg font-bold text-[#ffe9a8]">combo ×{hud.combo}</p>
          ) : null}
        </div>
      </div>

      {/* STACK bar */}
      {stack.length && phaseUi === "play" ? (
        <div className="pointer-events-none absolute inset-x-0 top-16 flex flex-wrap justify-center gap-1.5 px-16">
          {stack.map((s) => (
            <span key={s} className="rounded-md border border-white/15 bg-white/8 px-2 py-0.5 font-mono text-[10px] text-white/75">
              {s}
            </span>
          ))}
        </div>
      ) : null}

      {/* ToolsDeck super button */}
      {superReady && phaseUi === "play" ? (
        <button
          type="button"
          onClick={() => superFire.current()}
          aria-label="Fire the ToolsDeck barrage"
          className="absolute bottom-10 right-5 grid h-16 w-16 animate-pulse place-items-center rounded-2xl border-2 border-[#6ea8fe] bg-[#6ea8fe]/20 text-2xl shadow-[0_0_30px_rgba(110,168,254,0.5)]"
        >
          ⊞
        </button>
      ) : null}

      {/* hint */}
      {!hintGone ? (
        <p className="pointer-events-none absolute inset-x-0 bottom-10 text-center font-mono text-sm text-white/45">
          swipe fast through an orb — slow strokes don’t cut
        </p>
      ) : null}

      {/* END CARD */}
      {phaseUi === "endcard" ? (
        <div className="absolute inset-0 grid place-items-center p-5">
          <div className="w-[min(30rem,100%)] rounded-3xl border border-white/15 bg-[#12131c]/95 p-7 text-center shadow-2xl backdrop-blur-md">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#ffe9a8]">
              Shipped to prod
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              That monolith took you {finalStats.time}.
              <br />
              <span className="text-white/70">The real one took me a year.</span>
            </h2>
            <div className="mt-5 flex items-center justify-center gap-6 font-mono text-sm text-white/70">
              <span>score <b className="text-white">{finalStats.score}</b></span>
              <span>max combo <b className="text-white">×{finalStats.maxCombo}</b></span>
            </div>
            {finalStats.stack.length ? (
              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                {finalStats.stack.map((s) => (
                  <span key={s} className="rounded-md border border-white/15 bg-white/8 px-2 py-0.5 font-mono text-[10px] text-white/75">
                    {s}
                  </span>
                ))}
              </div>
            ) : null}
            <p className="mt-5 text-sm text-white/60">
              {site.name} — {site.role}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              <a
                href={`mailto:${site.email}`}
                className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition-transform hover:scale-[1.03]"
              >
                Let’s talk
              </a>
              <a href={site.socials.linkedin} target="_blank" rel="noreferrer" className="rounded-xl border border-white/20 px-4 py-3 text-sm text-white/85 hover:bg-white/10">
                LinkedIn
              </a>
              <button
                type="button"
                onClick={() => setRunId((r) => r + 1)}
                className="rounded-xl border border-white/20 px-4 py-3 text-sm text-white/85 hover:bg-white/10"
              >
                ↻ Replay
              </button>
              <a href="/" className="rounded-xl border border-white/20 px-4 py-3 text-sm text-white/85 hover:bg-white/10">
                Skim the résumé →
              </a>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-mono text-[11px] text-white/45">
              <a href={glassFocus.links.appstore} target="_blank" rel="noreferrer" className="hover:text-white/80">GlassFocus · App Store</a>
              <a href={glassFocus.links.googleplay} target="_blank" rel="noreferrer" className="hover:text-white/80">Google Play</a>
              <a href={site.socials.toolsdeck} target="_blank" rel="noreferrer" className="hover:text-white/80">ToolsDeck</a>
              <a href={site.socials.github} target="_blank" rel="noreferrer" className="hover:text-white/80">GitHub</a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
