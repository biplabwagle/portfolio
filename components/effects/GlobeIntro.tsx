"use client";

import { useEffect, useRef, useState } from "react";

/* ---------------------------------------------------------------------------
   Globe intro: a live snapshot of the actual page is wrapped onto a WebGL
   sphere that spins one full Earth-like rotation, then the projection morphs
   orthographic → flat (the page "unfolds" off the globe), the disc grows to
   fill the screen, and it cross-fades into the live page — seamlessly, because
   the globe was the page. Replays on every theme change. Skippable; skipped
   under reduced-motion / no-WebGL.
--------------------------------------------------------------------------- */

const VERT = `attribute vec2 aPos; varying vec2 vUv;
void main(){ vUv = aPos*0.5+0.5; gl_Position = vec4(aPos,0.0,1.0); }`;

const FRAG = `precision highp float;
varying vec2 vUv;
uniform vec2 uRes;
uniform float uRot, uFlatten, uRadius;
uniform sampler2D uTex;
uniform vec3 uBg, uAccent;
#define PI 3.141592653589793
void main(){
  vec2 screen = gl_FragCoord.xy / uRes;          // 0..1, origin bottom-left
  float m = min(uRes.x, uRes.y);
  vec2 c = (gl_FragCoord.xy - 0.5*uRes) / m;      // centered, y-up
  float f = smoothstep(0.0, 1.0, uFlatten);
  // Arc-length (azimuthal equidistant) mapping: a screen distance d lies at
  // angle d/R along the sphere surface. Because the page wraps the WHOLE
  // globe and R is sized so the wrapped circumference equals the page width,
  // unrolling preserves scale — no zoom overshoot, valid for every pixel.
  float R = uRadius;
  float dist = length(c);
  vec2 dir = dist > 1e-5 ? c / dist : vec2(0.0);
  float phi = min(dist / R, PI * 0.999);
  float sp = sin(phi);
  vec3 n = vec3(dir.x * sp, dir.y * sp, cos(phi));
  float lon = atan(n.x, n.z) + uRot;
  float lat = asin(clamp(n.y, -1.0, 1.0));
  vec2 uvSphere = vec2(lon/(2.0*PI) + 0.5, 0.5 - lat/PI);
  // The page snapshot fills the ENTIRE texture, so the flat end-state samples
  // the texture 1:1 across the viewport — pixel-aligned with the live page.
  vec2 uvFlat = vec2(screen.x, 1.0 - screen.y);
  // Late, gentle blend only corrects the small aspect mismatch.
  float fl = smoothstep(0.35, 1.0, f);
  vec2 uv = mix(uvSphere, uvFlat, fl);
  vec3 tex = texture2D(uTex, vec2(fract(uv.x), clamp(uv.y, 0.0, 1.0))).rgb;
  vec3 L = normalize(vec3(-0.4, 0.5, 0.85));
  float diff = clamp(dot(n, L), 0.0, 1.0);
  float shade = mix(0.74 + 0.3*diff, 1.0, f);
  float zr = clamp(cos(phi), 0.0, 1.0);
  float rim = pow(1.0 - zr, 3.0) * (1.0 - f);
  vec3 globe = tex*shade + uAccent*rim*0.55;
  // Globe edge sits at a quarter-wrap during the spin, then opens to the
  // screen corners as the page unrolls.
  float corner = 0.5 * length(uRes) / m;
  float edge = mix(R * PI * 0.5, corner + 0.08, pow(f, 1.6));
  float a = 1.0 - smoothstep(edge - 0.004, edge + 0.02, dist);
  vec3 bg = uBg + uAccent * 0.05 * exp(-dist*dist*5.0) * (1.0 - f);
  gl_FragColor = vec4(mix(bg, globe, a), 1.0);
}`;

const FADEIN = 320;
const SPIN = 2000;
const FLAT = 1200;
const FADE = 450;
const TOTAL = SPIN + FLAT + FADE;

const easeSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function cssRgb(v: string): [number, number, number] {
  const s = v.trim();
  if (s[0] === "#") {
    let h = s.slice(1);
    if (h.length === 3) h = h.split("").map((ch) => ch + ch).join("");
    const n = parseInt(h.slice(0, 6), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  const m = s.match(/[\d.]+/g);
  if (m) return [+m[0] / 255, +m[1] / 255, +m[2] / 255];
  return [0, 0, 0];
}

const TEX_W = 2048;
const TEX_H = 1024;

// Fills the texture with the theme background + a faint lat/long grid, so the
// parts of the globe not covered by the page snapshot still read as a globe.
function drawBackdrop(ctx: CanvasRenderingContext2D) {
  const s = getComputedStyle(document.documentElement);
  const bg = s.getPropertyValue("--color-bg").trim() || "#06060d";
  const bgSoft = s.getPropertyValue("--color-bg-soft").trim() || bg;
  const iris = s.getPropertyValue("--color-iris").trim() || "#818cf8";
  const grad = ctx.createLinearGradient(0, 0, 0, TEX_H);
  grad.addColorStop(0, bgSoft);
  grad.addColorStop(0.5, bg);
  grad.addColorStop(1, bgSoft);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  ctx.strokeStyle = iris;
  ctx.globalAlpha = 0.085;
  ctx.lineWidth = 1.5;
  for (let i = 1; i < 10; i++) {
    const y = (TEX_H / 10) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(TEX_W, y);
    ctx.stroke();
  }
  for (let i = 0; i < 24; i++) {
    const x = (TEX_W / 24) * i;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, TEX_H);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export function GlobeIntro() {
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const canvas = canvasRef.current!;
    const gl =
      (canvas.getContext("webgl", { alpha: false, antialias: true }) as
        | WebGLRenderingContext
        | null) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const U = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = U("uRes"),
      uRot = U("uRot"),
      uFlatten = U("uFlatten"),
      uRadius = U("uRadius"),
      uBg = U("uBg"),
      uAccent = U("uAccent");

    const skin = document.createElement("canvas");
    skin.width = TEX_W;
    skin.height = TEX_H;
    const sctx = skin.getContext("2d")!;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);

    const upload = () => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, skin);
      const s = getComputedStyle(document.documentElement);
      gl.uniform3fv(uBg, cssRgb(s.getPropertyValue("--color-bg") || "#06060d"));
      gl.uniform3fv(uAccent, cssRgb(s.getPropertyValue("--color-iris") || "#818cf8"));
    };

    const drawBackdropOnly = () => {
      drawBackdrop(sctx);
      upload();
    };

    const composeWithCapture = (cap: HTMLCanvasElement) => {
      // Crop the capture to the current viewport aspect (from the top, where
      // the hero lives) and stretch it across the WHOLE texture, so the page
      // wraps the entire sphere and the flat end-state is 1:1 with the screen.
      const aspect = window.innerWidth / window.innerHeight;
      const sw = cap.width;
      const sh = Math.min(cap.height, cap.width / aspect);
      sctx.clearRect(0, 0, TEX_W, TEX_H);
      sctx.drawImage(cap, 0, 0, sw, sh, 0, 0, TEX_W, TEX_H);
      upload();
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };

    let raf = 0;
    let startRef = 0;
    let skipping = false;
    let finished = false;
    let safety = 0;

    const finish = () => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      clearTimeout(safety);
      window.removeEventListener("resize", resize);
      cleanupSkip();
      try {
        (window as unknown as { __lenis?: { start: () => void } }).__lenis?.start();
      } catch {}
      document.body.style.removeProperty("overflow");
      canvas.style.display = "none";
    };

    const onSkip = () => {
      if (skipping || finished) return;
      skipping = true;
      startRef = performance.now() - SPIN;
    };
    const cleanupSkip = () => {
      window.removeEventListener("pointerdown", onSkip);
      window.removeEventListener("wheel", onSkip);
      window.removeEventListener("touchstart", onSkip);
      window.removeEventListener("keydown", onSkip);
    };

    // Arc-length radius: sized so the page wrapped once around the globe has
    // the same scale it has on screen — unrolling then changes curvature, not
    // size, which is what keeps the morph free of zoom overshoot.
    const baseRadius = () =>
      window.innerWidth /
      Math.min(window.innerWidth, window.innerHeight) /
      (2 * Math.PI);

    let isReplay = false;

    const drawAt = (e: number) => {
      const rot = easeSine(Math.min(e / SPIN, 1)) * Math.PI * 2;
      const R = baseRadius();
      const radius = R * (0.35 + 0.65 * easeOut(Math.min(e / 420, 1)));
      const flatten = easeSine(clamp01((e - SPIN) / FLAT));
      gl.uniform1f(uRot, rot);
      gl.uniform1f(uRadius, radius);
      gl.uniform1f(uFlatten, flatten);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      const fadeIn = isReplay ? 1 : clamp01(e / FADEIN);
      const fadeOut = clamp01((e - (SPIN + FLAT - 60)) / FADE);
      canvas.style.opacity = String(fadeIn * (1 - fadeOut));
    };

    const frame = (now: number) => {
      const held = (window as unknown as { __globePause?: number }).__globePause;
      const e = typeof held === "number" ? held : now - startRef;
      drawAt(e);
      if (typeof held !== "number" && e >= TOTAL) {
        finish();
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    const capture = async () => {
      const node = document.getElementById("top");
      if (!node) return;
      try {
        const { toCanvas } = await import("html-to-image");
        const bg = getComputedStyle(document.documentElement)
          .getPropertyValue("--color-bg")
          .trim();
        const cap = await toCanvas(node, {
          pixelRatio: 1.1,
          cacheBust: true,
          backgroundColor: bg || "#06060d",
          filter: (el) =>
            !(el instanceof HTMLElement && el.dataset.noCapture !== undefined),
        });
        if (cap.width && cap.height) composeWithCapture(cap);
      } catch {
        /* keep the backdrop-only globe */
      }
    };

    const play = (replay: boolean) => {
      finished = false;
      skipping = false;
      isReplay = replay;
      canvas.style.display = "block";
      canvas.style.opacity = replay ? "1" : "0";
      try {
        (window as unknown as { __lenis?: { stop: () => void } }).__lenis?.stop();
      } catch {}
      document.body.style.overflow = "hidden";
      drawBackdropOnly();
      resize();
      if (replay) {
        // Paint the first globe frame before the overlay shows, then snap the
        // page to the hero underneath it so the unfold lands where it reveals.
        drawAt(0);
        try {
          const lenis = (window as unknown as {
            __lenis?: { scrollTo: (t: number, o?: object) => void };
          }).__lenis;
          if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
          else window.scrollTo(0, 0);
        } catch {
          window.scrollTo(0, 0);
        }
      }
      window.addEventListener("resize", resize);
      window.addEventListener("pointerdown", onSkip);
      window.addEventListener("wheel", onSkip, { passive: true });
      window.addEventListener("touchstart", onSkip, { passive: true });
      window.addEventListener("keydown", onSkip);
      startRef = performance.now();
      raf = requestAnimationFrame(frame);
      // Fail-safe: never let the overlay get stuck if a frame errors.
      clearTimeout(safety);
      safety = window.setTimeout(() => {
        const held = (window as unknown as { __globePause?: number }).__globePause;
        if (typeof held !== "number") finish();
      }, TOTAL + 1500);
      // Swap in the real page snapshot as soon as it's ready (globe spins meanwhile).
      capture();
    };

    const onThemeChange = () => {
      cancelAnimationFrame(raf);
      cleanupSkip();
      play(true);
    };

    play(false);
    window.addEventListener("theme-change", onThemeChange);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(safety);
      window.removeEventListener("resize", resize);
      window.removeEventListener("theme-change", onThemeChange);
      cleanupSkip();
      document.body.style.removeProperty("overflow");
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      data-no-capture
      style={{ display: "none" }}
      className="fixed inset-0 z-[200] h-full w-full"
    />
  );
}
