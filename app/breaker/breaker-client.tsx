"use client";

import { useEffect, useRef, useState } from "react";

/* ----------------------------------------------------------------------------
   MONOLITH BREAKER — kill-gate prototype (unlisted /breaker).
   Scope: blade + authored volleys + full juice + combo economy + one bug type
   + mini STACK bar. NO eras/power-ups/monolith yet — this build exists to
   answer one question: does slicing an orb make you involuntarily smile?

   Anti-Dig firewall (core mechanics, not tuning):
   - Blade only ARMS on a fast deliberate stroke (≥8% of viewport in ≤150ms);
     idle wiggling draws sparks but cannot slice.
   - Combo decays after 4s without a slice.
   - Slicing a red BUG cracks the screen and resets the combo (never game over).
   All state in refs; single rAF loop; Canvas 2D; zero dependencies.
---------------------------------------------------------------------------- */

const BG = "#0b0c13";
const ARM_FRAC = 0.08; // stroke length (of min viewport side) to arm
const ARM_WINDOW = 150; // ms
const TRAIL_TTL = 160; // ms
const CHAIN_WINDOW = 170; // ms between slices to count as one stroke
const COMBO_DECAY = 4000; // ms

type Kind = "tech" | "logo" | "bug";
type Orb = {
  x: number; y: number; vx: number; vy: number; r: number;
  kind: Kind; label: string; hue: number; spin: number; rot: number;
  sliced: boolean;
};
type Shard = { x: number; y: number; vx: number; vy: number; rot: number; vr: number; life: number; hue: number; pts: number[] };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; hue: number };
type Stamp = { text: string; x: number; y: number; life: number; big: boolean };
type TrailPt = { x: number; y: number; t: number };
type Trail = { pts: TrailPt[]; chain: number; lastSlice: number };

const TECH: [string, number][] = [
  ["Java", 24], ["Spring", 130], ["React", 190], ["Angular", 350],
  ["Kafka", 270], ["K8s", 210], ["AWS", 32], ["SQL", 200], ["TS", 215], ["LLMs", 280],
];

/* Authored volley chart — one ~22s loop, speeding up 6% per loop.
   xf = spawn x (fraction), vxf = horizontal drift (fraction of W per s),
   apex = arc peak as fraction of height from top. */
type Ev = { at: number; orbs: { xf: number; vxf: number; apex: number; kind?: Kind; label?: string }[] };
const CHART: Ev[] = [
  { at: 0.6, orbs: [{ xf: 0.5, vxf: 0.02, apex: 0.3, kind: "logo", label: "BW" }] },
  { at: 2.6, orbs: [{ xf: 0.28, vxf: 0.11, apex: 0.32 }, { xf: 0.72, vxf: -0.11, apex: 0.32 }] },
  { at: 5.0, orbs: [{ xf: 0.25, vxf: 0.05, apex: 0.38 }, { xf: 0.5, vxf: 0, apex: 0.3 }, { xf: 0.75, vxf: -0.05, apex: 0.38 }] },
  { at: 7.6, orbs: [{ xf: 0.4, vxf: 0.03, apex: 0.26 }, { xf: 0.6, vxf: -0.03, apex: 0.42 }] },
  { at: 9.8, orbs: [{ xf: 0.3, vxf: 0.1, apex: 0.34 }, { xf: 0.5, vxf: 0, apex: 0.24, kind: "bug", label: "BUG" }, { xf: 0.7, vxf: -0.1, apex: 0.34 }] },
  { at: 12.4, orbs: [{ xf: 0.15, vxf: 0.06, apex: 0.42 }, { xf: 0.35, vxf: 0.04, apex: 0.34 }, { xf: 0.55, vxf: -0.02, apex: 0.28 }, { xf: 0.75, vxf: -0.06, apex: 0.36 }] },
  { at: 15.2, orbs: [{ xf: 0.5, vxf: 0.14, apex: 0.3 }, { xf: 0.5, vxf: -0.14, apex: 0.3 }, { xf: 0.5, vxf: 0, apex: 0.2, kind: "bug", label: "BUG" }] },
  { at: 17.8, orbs: [{ xf: 0.2, vxf: 0.08, apex: 0.3 }, { xf: 0.4, vxf: 0.04, apex: 0.26 }, { xf: 0.6, vxf: -0.04, apex: 0.26 }, { xf: 0.8, vxf: -0.08, apex: 0.3 }] },
  { at: 20.4, orbs: [{ xf: 0.35, vxf: 0.12, apex: 0.24 }, { xf: 0.65, vxf: -0.12, apex: 0.24 }, { xf: 0.5, vxf: 0, apex: 0.4, kind: "bug", label: "BUG" }] },
];
const LOOP_LEN = 22.5;

export function BreakerPrototype() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hud, setHud] = useState({ score: 0, best: 0, combo: 0 });
  const [stack, setStack] = useState<string[]>([]);
  const [hintGone, setHintGone] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

    /* ---------- state ---------- */
    const orbs: Orb[] = [];
    const shards: Shard[] = [];
    const sparks: Spark[] = [];
    const stamps: Stamp[] = [];
    const trails = new Map<number, Trail>();
    let score = 0, best = 0, combo = 0, lastSliceAt = -1e9;
    let freezeUntil = 0, shake = 0, crackUntil = 0;
    let loopStart = performance.now(), evIdx = 0, speed = 1;
    let firstSlice = false;
    const stacked = new Set<string>();
    try { best = Number(localStorage.getItem("bw-breaker-hi") || 0); } catch {}

    /* ---------- audio (synth only, created on first gesture) ---------- */
    let ac: AudioContext | null = null;
    const ensureAudio = () => {
      if (ac) return;
      try { ac = new AudioContext(); } catch {}
    };
    const blip = (f0: number, f1: number, dur: number, type: OscillatorType, vol: number) => {
      if (!ac || ac.state !== "running") { ac?.resume?.().catch(() => {}); if (!ac || ac.state !== "running") return; }
      try {
        const t = ac.currentTime;
        const o = ac.createOscillator(); const g = ac.createGain();
        o.type = type; o.frequency.setValueAtTime(f0, t);
        o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + dur);
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
      } catch {}
    };
    const sliceSound = (chain: number) => {
      blip(95, 55, 0.09, "sine", 0.5); // thock
      const semis = Math.min(combo, 24) + (chain - 1) * 2;
      blip(523 * Math.pow(2, semis / 12), 523 * Math.pow(2, semis / 12), 0.16, "triangle", 0.22); // rising chime
    };
    const crackSound = () => { blip(220, 40, 0.25, "sawtooth", 0.3); };

    /* ---------- helpers ---------- */
    const spawn = (e: Ev["orbs"][number]) => {
      const r = Math.max(26, minSide * 0.052);
      const apexY = H * e.apex;
      const g = H * 0.95; // gravity px/s²
      const vy = -Math.sqrt(2 * g * Math.max(H - apexY, 50));
      const kind: Kind = e.kind ?? "tech";
      const [label, hue] = kind === "tech"
        ? TECH[(Math.random() * TECH.length) | 0]
        : kind === "logo" ? ["BW", 250] : ["BUG", 0];
      orbs.push({
        x: e.xf * W, y: H + r + 4, vx: e.vxf * W, vy: vy * (0.97 + Math.random() * 0.06),
        r, kind, label: e.label ?? (label as string), hue: hue as number,
        spin: (Math.random() - 0.5) * 2, rot: 0, sliced: false,
      });
    };

    const addStamp = (text: string, x: number, y: number, big = false) =>
      stamps.push({ text, x, y, life: 1, big });

    const burst = (o: Orb, ang: number) => {
      const n = reduce ? 6 : 12;
      for (let i = 0; i < n; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const sp = 90 + Math.random() * 240;
        const a = ang + Math.PI / 2 * side + (Math.random() - 0.5) * 0.9;
        const pts: number[] = [];
        const m = 3 + ((Math.random() * 3) | 0);
        for (let k = 0; k < m; k++) {
          const rr = o.r * (0.18 + Math.random() * 0.4);
          const aa = (k / m) * Math.PI * 2;
          pts.push(Math.cos(aa) * rr, Math.sin(aa) * rr);
        }
        shards.push({
          x: o.x, y: o.y,
          vx: Math.cos(a) * sp + o.vx * 0.35, vy: Math.sin(a) * sp + o.vy * 0.25,
          rot: Math.random() * 6, vr: (Math.random() - 0.5) * 10, life: 1, hue: o.hue, pts,
        });
      }
    };

    const doSlice = (o: Orb, trail: Trail, ang: number, now: number) => {
      o.sliced = true;
      const chained = now - trail.lastSlice <= CHAIN_WINDOW;
      trail.chain = chained ? trail.chain + 1 : 1;
      trail.lastSlice = now;

      if (o.kind === "bug") {
        combo = 0;
        crackUntil = now + 500;
        shake = reduce ? 0 : 14;
        crackSound();
        try { navigator.vibrate?.(45); } catch {}
        addStamp("COMBO LOST", o.x, o.y, false);
        burst(o, ang);
        return;
      }
      combo += 1;
      lastSliceAt = now;
      const mult = 1 + Math.min(combo, 40) * 0.1;
      const gain = Math.round(25 * trail.chain * mult);
      score += gain;
      if (score > best) { best = score; try { localStorage.setItem("bw-breaker-hi", String(best)); } catch {} }
      freezeUntil = now + (reduce ? 15 : 60);
      shake = reduce ? 0 : Math.min(4 + trail.chain * 2.5, 18);
      sliceSound(trail.chain);
      try { navigator.vibrate?.(trail.chain > 1 ? [12, 25, 14] : 9); } catch {}
      burst(o, ang);
      if (!firstSlice) { firstSlice = true; setHintGone(true); }
      if (trail.chain >= 2) addStamp(`x${trail.chain}`, o.x, o.y - o.r, true);
      else if (combo === 1) addStamp("SLICE", o.x, o.y - o.r, false);
      addStamp(`+${gain}`, o.x + o.r * 0.7, o.y + o.r * 0.4, false);
      if (o.kind === "tech" && !stacked.has(o.label)) {
        stacked.add(o.label);
        setStack([...stacked]);
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
      const px2 = a.x + s * dx - o.x, py2 = a.y + s * dy - o.y;
      return px2 * px2 + py2 * py2 <= o.r * o.r;
    };

    const onPointerDown = (e: PointerEvent) => {
      ensureAudio();
      const t = trailFor(e.pointerId);
      t.pts.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    };
    const onPointerMove = (e: PointerEvent) => {
      // touch: only track while pressed; mouse: always (mouse IS the blade)
      if (e.pointerType !== "mouse" && e.buttons === 0) return;
      const now = performance.now();
      const t = trailFor(e.pointerId);
      const prev = t.pts[t.pts.length - 1];
      t.pts.push({ x: e.clientX, y: e.clientY, t: now });
      if (t.pts.length > 40) t.pts.shift();
      // sparks at the tip, armed or not (the toy is fun pre-comprehension)
      if (prev && !reduce) {
        sparks.push({
          x: e.clientX, y: e.clientY,
          vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60 - 30,
          life: 1, hue: 210 + Math.random() * 80,
        });
      }
      if (!prev || !isArmed(t, now)) return;
      const ang = Math.atan2(e.clientY - prev.y, e.clientX - prev.x);
      for (const o of orbs) {
        if (!o.sliced && segHitsOrb(prev, { x: e.clientX, y: e.clientY, t: now }, o)) {
          doSlice(o, t, ang, now);
        }
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      const t = trails.get(e.pointerId);
      if (t && e.pointerType !== "mouse") trails.delete(e.pointerId);
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    /* ---------- render bits ---------- */
    const drawOrb = (o: Orb) => {
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(o.rot);
      if (o.kind === "bug") {
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
        const grad = ctx.createRadialGradient(-o.r * 0.35, -o.r * 0.4, o.r * 0.1, 0, 0, o.r);
        grad.addColorStop(0, `hsla(${o.hue}, 85%, 72%, 0.95)`);
        grad.addColorStop(0.55, `hsla(${o.hue}, 70%, 45%, 0.85)`);
        grad.addColorStop(1, `hsla(${o.hue}, 70%, 22%, 0.9)`);
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, 0, o.r, 0, Math.PI * 2); ctx.fill();
        // glass rim
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, 0, o.r - 1, -2.4, -0.6); ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255,0.14)";
        ctx.beginPath(); ctx.arc(0, 0, o.r - 1, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = o.kind === "logo" ? "#fff" : "rgba(255,255,255,0.95)";
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
        // chromatic fringes
        for (const [off, color] of [[-1.6, "rgba(80,200,255,0.5)"], [1.6, "rgba(255,90,200,0.5)"]] as const) {
          ctx.strokeStyle = color; ctx.lineWidth = w * 0.9; ctx.lineCap = "round"; ctx.lineJoin = "round";
          ctx.beginPath();
          pts.forEach((p, i) => ctx[i ? "lineTo" : "moveTo"](p.x + off, p.y + off));
          ctx.stroke();
        }
        // core
        ctx.strokeStyle = armed ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.45)";
        ctx.lineWidth = w * 0.55;
        ctx.beginPath();
        pts.forEach((p, i) => ctx[i ? "lineTo" : "moveTo"](p.x, p.y));
        ctx.stroke();
      }
      ctx.restore();
    };

    /* ---------- main loop ---------- */
    let last = performance.now();
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      let dt = Math.min((now - last) / 1000, 0.032);
      last = now;
      if (document.hidden) return;
      const frozen = now < freezeUntil;
      if (frozen) dt = 0;

      // spawn from chart
      const loopT = ((now - loopStart) / 1000) * speed;
      while (evIdx < CHART.length && loopT >= CHART[evIdx].at) {
        for (const o of CHART[evIdx].orbs) spawn(o);
        evIdx++;
      }
      if (loopT >= LOOP_LEN) { loopStart = now; evIdx = 0; speed = Math.min(speed * 1.06, 1.6); }

      // combo decay
      if (combo > 0 && now - lastSliceAt > COMBO_DECAY) combo = 0;

      // physics
      const g = H * 0.95;
      for (const o of orbs) { o.x += o.vx * dt; o.y += o.vy * dt; o.vy += g * dt; o.rot += o.spin * dt; }
      for (let i = orbs.length - 1; i >= 0; i--) {
        if (orbs[i].sliced || orbs[i].y > H + orbs[i].r * 2 + 40) orbs.splice(i, 1);
      }
      for (let i = shards.length - 1; i >= 0; i--) {
        const s = shards[i];
        s.x += s.vx * dt; s.y += s.vy * dt; s.vy += g * 0.8 * dt; s.rot += s.vr * dt; s.life -= dt * 1.4;
        if (s.life <= 0) shards.splice(i, 1);
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 220 * dt; s.life -= dt * 2.6;
        if (s.life <= 0) sparks.splice(i, 1);
      }
      for (let i = stamps.length - 1; i >= 0; i--) {
        const s = stamps[i];
        s.y -= 42 * dt; s.life -= dt * (s.big ? 0.9 : 1.4);
        if (s.life <= 0) stamps.splice(i, 1);
      }
      // trim stale mouse trails
      for (const t of trails.values()) {
        while (t.pts.length && now - t.pts[0].t > TRAIL_TTL * 2) t.pts.shift();
      }

      /* draw */
      ctx.save();
      shake *= 0.88;
      if (shake > 0.3) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
      ctx.fillStyle = BG;
      ctx.fillRect(-24, -24, W + 48, H + 48);
      // faint vignette
      const vg = ctx.createRadialGradient(W / 2, H / 2, minSide * 0.3, W / 2, H / 2, minSide * 0.85);
      vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.45)");
      ctx.fillStyle = vg; ctx.fillRect(-24, -24, W + 48, H + 48);

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
      for (const o of orbs) drawOrb(o);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const s of sparks) {
        ctx.globalAlpha = Math.max(s.life, 0) * 0.85;
        ctx.fillStyle = `hsla(${s.hue}, 90%, 70%, 1)`;
        ctx.fillRect(s.x - 1.4, s.y - 1.4, 2.8, 2.8);
      }
      ctx.restore();
      drawTrails(now);
      for (const s of stamps) {
        ctx.save();
        ctx.globalAlpha = Math.min(s.life * 1.6, 1);
        ctx.fillStyle = s.big ? "#ffe9a8" : "rgba(255,255,255,0.9)";
        ctx.font = `800 ${s.big ? 34 : 16}px ui-sans-serif, system-ui`;
        ctx.textAlign = "center";
        ctx.fillText(s.text, s.x, s.y);
        ctx.restore();
      }
      // bug crack overlay
      if (now < crackUntil) {
        ctx.save();
        ctx.globalAlpha = ((crackUntil - now) / 500) * 0.5;
        ctx.fillStyle = "rgba(255,30,50,1)";
        ctx.fillRect(-24, -24, W + 48, H + 48);
        ctx.restore();
      }
      ctx.restore();
    };
    raf = requestAnimationFrame(loop);

    // HUD sync (cheap, 6-7Hz)
    const hudTimer = setInterval(() => {
      setHud((h) =>
        h.score === score && h.best === best && h.combo === combo ? h : { score, best, combo }
      );
    }, 150);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(hudTimer);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      ac?.close?.().catch(() => {});
    };
  }, []);

  return (
    <div data-no-cursor className="fixed inset-0 z-[300] select-none" style={{ background: BG }}>
      <canvas ref={canvasRef} className="absolute inset-0 touch-none" />

      {/* HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
        <div>
          <a
            href="/"
            className="pointer-events-auto rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10"
          >
            ← waglegroup.com
          </a>
          <p className="mt-3 font-mono text-2xl font-bold text-white">{hud.score}</p>
          <p className="font-mono text-[11px] text-white/40">best {hud.best}</p>
        </div>
        <div className="text-right">
          <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">
            prototype
          </span>
          {hud.combo >= 2 ? (
            <p className="mt-2 font-mono text-lg font-bold text-[#ffe9a8]">
              combo ×{hud.combo}
            </p>
          ) : null}
        </div>
      </div>

      {/* mini STACK bar */}
      {stack.length ? (
        <div className="pointer-events-none absolute inset-x-0 top-16 flex flex-wrap justify-center gap-1.5 px-16">
          {stack.map((s) => (
            <span
              key={s}
              className="rounded-md border border-white/15 bg-white/8 px-2 py-0.5 font-mono text-[10px] text-white/75"
            >
              {s}
            </span>
          ))}
        </div>
      ) : null}

      {/* one-line hint, dies on first slice */}
      {!hintGone ? (
        <p className="pointer-events-none absolute inset-x-0 bottom-10 text-center font-mono text-sm text-white/45">
          swipe fast through an orb — slow strokes don’t cut
        </p>
      ) : null}
    </div>
  );
}
