/* ----------------------------------------------------------------------------
   Falling-sand cellular automaton for THE DIG.
   Pure TypeScript, no React/DOM — the component drives it via step()/dig().

   Cell encoding (Uint8Array):
     0            empty
     1..63        sand, value-1 = stratum index (era → color)
     128..191     artifact cell, value-128 = artifact index (immovable)

   Sand rules (classic): fall straight down; else slide diagonally down-left /
   down-right. Scan bottom-up with alternating x-direction per row per frame to
   avoid directional bias. Artifacts and grid borders never move.
---------------------------------------------------------------------------- */

export const EMPTY = 0;
export const SAND_BASE = 1;
export const ARTIFACT_BASE = 128;

export type ArtifactSpec = {
  id: string;
  /** 12×12-ish pixel glyph: rows of '.'(empty) and '#'(solid) */
  glyph: string[];
  /** horizontal placement, fraction of grid width (glyph center) */
  x: number;
  /** vertical placement, fraction of the SAND REGION height (glyph center) */
  y: number;
};

export type EngineConfig = {
  cols: number;
  rows: number;
  /** row where sand begins (headspace above stays empty) */
  sandTop: number;
  /** stratum boundaries as fractions of the sand region, cumulative, len = strata count */
  strata: number[];
  artifacts: ArtifactSpec[];
};

export type Artifact = {
  id: string;
  index: number;
  /** bounding box in cells */
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  cells: number; // solid glyph cells
  unearthed: boolean;
};

export class SandEngine {
  readonly cols: number;
  readonly rows: number;
  readonly sandTop: number;
  grid: Uint8Array;
  artifacts: Artifact[] = [];
  /** grains removed by digging (for a little score-less stat) */
  dug = 0;
  private flip = false;

  constructor(cfg: EngineConfig) {
    this.cols = cfg.cols;
    this.rows = cfg.rows;
    this.sandTop = cfg.sandTop;
    this.grid = new Uint8Array(cfg.cols * cfg.rows);
    this.fillStrata(cfg.strata);
    this.placeArtifacts(cfg.artifacts);
  }

  private idx(x: number, y: number) {
    return y * this.cols + x;
  }

  private fillStrata(strata: number[]) {
    const sandRows = this.rows - this.sandTop;
    for (let y = this.sandTop; y < this.rows; y++) {
      const frac = (y - this.sandTop) / sandRows;
      let s = 0;
      while (s < strata.length - 1 && frac >= strata[s]) s++;
      const v = SAND_BASE + s;
      for (let x = 0; x < this.cols; x++) {
        this.grid[this.idx(x, y)] = v;
      }
    }
  }

  private placeArtifacts(specs: ArtifactSpec[]) {
    const sandRows = this.rows - this.sandTop;
    specs.forEach((spec, i) => {
      const gw = Math.max(...spec.glyph.map((r) => r.length));
      const gh = spec.glyph.length;
      const cx = Math.round(spec.x * this.cols);
      const cy = this.sandTop + Math.round(spec.y * sandRows);
      const x0 = Math.max(1, Math.min(this.cols - gw - 1, cx - (gw >> 1)));
      const y0 = Math.max(this.sandTop + 1, Math.min(this.rows - gh - 1, cy - (gh >> 1)));
      let cells = 0;
      for (let gy = 0; gy < gh; gy++) {
        const row = spec.glyph[gy];
        for (let gx = 0; gx < row.length; gx++) {
          if (row[gx] === "#") {
            this.grid[this.idx(x0 + gx, y0 + gy)] = ARTIFACT_BASE + i;
            cells++;
          }
        }
      }
      this.artifacts.push({
        id: spec.id,
        index: i,
        x0,
        y0,
        x1: x0 + gw - 1,
        y1: y0 + gh - 1,
        cells,
        unearthed: false,
      });
    });
  }

  /** One physics tick. Returns true if any grain moved (for idle sleep). */
  step(): boolean {
    const { grid, cols, rows } = this;
    let moved = false;
    this.flip = !this.flip;
    for (let y = rows - 2; y >= 0; y--) {
      const leftToRight = (y & 1) === 0 ? this.flip : !this.flip;
      for (let i = 0; i < cols; i++) {
        const x = leftToRight ? i : cols - 1 - i;
        const c = grid[y * cols + x];
        if (c < SAND_BASE || c >= ARTIFACT_BASE) continue; // empty or artifact
        const below = (y + 1) * cols + x;
        if (grid[below] === EMPTY) {
          grid[below] = c;
          grid[y * cols + x] = EMPTY;
          moved = true;
          continue;
        }
        // diagonal slide — try the scan direction first for symmetry
        const d1 = leftToRight ? 1 : -1;
        const x1 = x + d1;
        const x2 = x - d1;
        if (x1 >= 0 && x1 < cols && grid[below + d1] === EMPTY && grid[y * cols + x1] === EMPTY) {
          grid[below + d1] = c;
          grid[y * cols + x] = EMPTY;
          moved = true;
        } else if (x2 >= 0 && x2 < cols && grid[below - d1] === EMPTY && grid[y * cols + x2] === EMPTY) {
          grid[below - d1] = c;
          grid[y * cols + x] = EMPTY;
          moved = true;
        }
      }
    }
    return moved;
  }

  /** Remove sand in a radius around (cx, cy) in cell coords. Artifacts survive. */
  dig(cx: number, cy: number, r: number) {
    const { grid, cols, rows } = this;
    const r2 = r * r;
    const x0 = Math.max(0, cx - r);
    const x1 = Math.min(cols - 1, cx + r);
    const y0 = Math.max(0, cy - r);
    const y1 = Math.min(rows - 1, cy + r);
    for (let y = y0; y <= y1; y++) {
      const dy = y - cy;
      for (let x = x0; x <= x1; x++) {
        const dx = x - cx;
        if (dx * dx + dy * dy > r2) continue;
        const i = y * cols + x;
        const c = grid[i];
        if (c >= SAND_BASE && c < ARTIFACT_BASE) {
          grid[i] = EMPTY;
          this.dug++;
        }
      }
    }
  }

  /**
   * An artifact is unearthed when few of its solid cells still carry sand
   * directly above them (within `look` cells). Cheap: called every ~15 frames.
   */
  checkUnearthed(look = 3, threshold = 0.22): Artifact[] {
    const fresh: Artifact[] = [];
    for (const a of this.artifacts) {
      if (a.unearthed) continue;
      let covered = 0;
      let solid = 0;
      for (let y = a.y0; y <= a.y1; y++) {
        for (let x = a.x0; x <= a.x1; x++) {
          if (this.grid[y * this.cols + x] !== ARTIFACT_BASE + a.index) continue;
          solid++;
          for (let k = 1; k <= look; k++) {
            const yy = y - k;
            if (yy < 0) break;
            const v = this.grid[yy * this.cols + x];
            if (v >= SAND_BASE && v < ARTIFACT_BASE) {
              covered++;
              break;
            }
          }
        }
      }
      if (solid > 0 && covered / solid < threshold) {
        a.unearthed = true;
        fresh.push(a);
      }
    }
    return fresh;
  }

  /** Drain pass for the finale: delete a band of bottom-most sand each call. */
  drain(rowsPerCall = 2): boolean {
    const { grid, cols, rows } = this;
    let removed = false;
    let cleared = 0;
    for (let y = rows - 1; y >= 0 && cleared < rowsPerCall; y--) {
      let rowHad = false;
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        const c = grid[i];
        if (c >= SAND_BASE && c < ARTIFACT_BASE) {
          grid[i] = EMPTY;
          rowHad = true;
          removed = true;
        }
      }
      if (rowHad) cleared++;
    }
    return removed;
  }

  remainingSand(): number {
    let n = 0;
    for (let i = 0; i < this.grid.length; i++) {
      const c = this.grid[i];
      if (c >= SAND_BASE && c < ARTIFACT_BASE) n++;
    }
    return n;
  }
}
