/**
 * Tests for buildModel() — the geometric core.
 *
 * These tests verify:
 *   • Correct point placement (radius, angle)
 *   • 3-head rotational symmetry
 *   • Collision detection (pairwise clearance)
 *   • Warning generation for invalid configs
 *   • Edge cases (1 layer, 8 layers, tiny tray, huge tool)
 */
import { describe, it, expect } from 'vitest';
import { buildModel, norm360, SAFETY_CLEARANCE_MM } from '../model';
import type { ModelParams } from '../model';

// ─────────────────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────────────────
function makeParams(overrides: Partial<ModelParams> = {}): ModelParams {
  return {
    trayD: 300,      // 30 cm in mm
    tool: 3.5,
    margin: 25,
    layers: 4,
    spacing: 20,     // radial step (see note below)
    mode: 'all',
    rawBase: 12,
    addAngle: 0,
    custom: Array.from({ length: 8 }, () => ({ n: 12, off: 0 })),
    t: { dwell: 120, index: 150, layer: 1000 },
    ...overrides,
  };
}

// Deterministic PRNG for property-style tests
function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

// ─────────────────────────────────────────────────────────
// Basic structure
// ─────────────────────────────────────────────────────────
describe('buildModel — structure', () => {
  it('creates one layer object per requested layer (up to machine max 7)', () => {
    for (const n of [1, 2, 4, 7]) {
      const m = buildModel(makeParams({ layers: n }));
      expect(m.layers).toHaveLength(n);
    }
    expect(buildModel(makeParams({ layers: 8 })).layers).toHaveLength(7);
  });

  it('totalPts equals sum of per-layer point counts', () => {
    const m = buildModel(makeParams({ layers: 4, rawBase: 15 }));
    const sum = m.layers.reduce((acc, l) => acc + l.n, 0);
    expect(m.totalPts).toBe(sum);
    expect(m.totalPts).toBe(4 * 15);
  });

  it('totalSteps equals sum of per-layer points-per-head', () => {
    const m = buildModel(makeParams({ layers: 3, rawBase: 12 }));
    // Each layer: 12 points / 3 heads = 4 steps per head
    expect(m.totalSteps).toBe(3 * 4);
  });

  it('all[] contains every point from every layer', () => {
    const m = buildModel(makeParams({ layers: 4, rawBase: 12 }));
    expect(m.all).toHaveLength(48);
    for (const layer of m.layers) {
      for (const pt of layer.pts) {
        expect(m.all).toContain(pt);
      }
    }
  });
});

// ─────────────────────────────────────────────────────────
// Geometry — radii
// ─────────────────────────────────────────────────────────
describe('buildModel — geometry (radii)', () => {
  it('first layer at R - margin (d1 = trayD - 2*margin)', () => {
    const m = buildModel(makeParams({ trayD: 300, margin: 25 }));
    expect(m.d1).toBeCloseTo(250, 6);
    expect(m.r1).toBeCloseTo(125, 6);
  });

  it('last layer at r1 - spacing*(layers-1)', () => {
    const m = buildModel(makeParams({
      trayD: 300, margin: 25, spacing: 20, layers: 4,
    }));
    // r_last = 125 - 20*3 = 65
    expect(m.rLast).toBeCloseTo(65, 6);
    expect(m.rLast).toBeCloseTo(m.layers[m.layers.length - 1].r, 6);
  });

  it('each layer radius matches its index formula', () => {
    const m = buildModel(makeParams({ trayD: 300, margin: 25, spacing: 20, layers: 4 }));
    const radialStep = m.layers[0].r - m.layers[1].r;
    for (let i = 1; i < m.layers.length; i++) {
      const expected = m.layers[i - 1].r - radialStep;
      expect(m.layers[i].r).toBeCloseTo(expected, 6);
    }
  });

  it('all points lie exactly on their layer radius', () => {
    const m = buildModel(makeParams({ layers: 5, rawBase: 30 }));
    for (const layer of m.layers) {
      for (const pt of layer.pts) {
        const r = Math.sqrt(pt.x * pt.x + pt.y * pt.y);
        expect(r).toBeCloseTo(layer.r, 6);
      }
    }
  });

  it('all points lie inside tray radius', () => {
    const m = buildModel(makeParams({ layers: 8, rawBase: 12 }));
    for (const pt of m.all) {
      const r = Math.sqrt(pt.x * pt.x + pt.y * pt.y);
      expect(r).toBeLessThanOrEqual(m.R + 1e-6);
    }
  });
});

// ─────────────────────────────────────────────────────────
// Geometry — angles
// ─────────────────────────────────────────────────────────
describe('buildModel — geometry (angles)', () => {
  it('step angle equals 360 / n', () => {
    for (const n of [3, 6, 12, 24, 120]) {
      const m = buildModel(makeParams({ layers: 1, rawBase: n }));
      expect(m.layers[0].step).toBeCloseTo(360 / n, 6);
    }
  });

  it('consecutive points are `step` apart', () => {
    const m = buildModel(makeParams({ layers: 1, rawBase: 12, addAngle: 0 }));
    const layer = m.layers[0];
    for (let k = 0; k < layer.n - 1; k++) {
      const delta = norm360(layer.pts[k + 1].a - layer.pts[k].a);
      expect(delta).toBeCloseTo(layer.step, 4);
    }
  });

  it('applies addAngle cumulatively per layer (mode=all)', () => {
    const m = buildModel(makeParams({ layers: 4, addAngle: 5, rawBase: 12 }));
    for (let i = 0; i < m.layers.length; i++) {
      expect(m.layers[i].off).toBeCloseTo(i * 5, 6);
    }
  });

  it('honors custom offsets per layer (mode=custom)', () => {
    const custom = [
      { n: 12, off: 0 },
      { n: 15, off: 7.5 },
      { n: 9, off: 15 },
      { n: 6, off: 22.5 },
    ];
    const m = buildModel(makeParams({ mode: 'custom', custom, layers: 4 }));
    expect(m.layers[0].off).toBe(0);
    expect(m.layers[1].off).toBe(7.5);
    expect(m.layers[2].off).toBe(15);
    expect(m.layers[3].off).toBe(22.5);
  });

  it('all angles lie in [0, 360)', () => {
    const m = buildModel(makeParams({ layers: 8, rawBase: 24, addAngle: 7.3 }));
    for (const pt of m.all) {
      expect(pt.a).toBeGreaterThanOrEqual(0);
      expect(pt.a).toBeLessThan(360);
    }
  });
});

// ─────────────────────────────────────────────────────────
// 3-head symmetry
// ─────────────────────────────────────────────────────────
describe('buildModel — 3-head symmetry', () => {
  it('distributes points equally across 3 heads', () => {
    const m = buildModel(makeParams({ rawBase: 12 }));
    const counts = [0, 0, 0];
    for (const pt of m.all) counts[pt.head]++;
    expect(counts[0]).toBe(counts[1]);
    expect(counts[1]).toBe(counts[2]);
    expect(counts[0]).toBe(m.totalPts / 3);
  });

  it('head index groups points by 120° sector (floor(k / per))', () => {
    const m = buildModel(makeParams({ rawBase: 9 }));
    const layer = m.layers[0];
    for (let k = 0; k < layer.n; k++) {
      expect(layer.pts[k].head).toBe(Math.floor(k / layer.per));
    }
  });

  it('head_step j cycles within each head (k % per)', () => {
    const m = buildModel(makeParams({ rawBase: 12 }));
    const layer = m.layers[0];
    for (let k = 0; k < layer.n; k++) {
      expect(layer.pts[k].j).toBe(k % layer.per);
    }
  });

  it('heads are exactly 120° apart (addAngle=0)', () => {
    const m = buildModel(makeParams({ rawBase: 12, addAngle: 0 }));
    const layer = m.layers[0];
    const per = layer.per;
    for (let k = 0; k < per; k++) {
      const a0 = layer.pts[k].a;
      const a1 = layer.pts[k + per].a;
      const a2 = layer.pts[k + 2 * per].a;
      expect(norm360(a1 - a0)).toBeCloseTo(120, 4);
      expect(norm360(a2 - a1)).toBeCloseTo(120, 4);
      expect(norm360(a0 - a2)).toBeCloseTo(120, 4);
    }
  });

  it('3 heads produce 3 points at same radius for every angular slot', () => {
    const m = buildModel(makeParams({ rawBase: 30, layers: 1 }));
    const layer = m.layers[0];
    const per = layer.per;   // 10
    for (let j = 0; j < per; j++) {
      const p1 = layer.pts[j];
      const p2 = layer.pts[j + per];
      const p3 = layer.pts[j + 2 * per];
      expect(Math.sqrt(p1.x * p1.x + p1.y * p1.y)).toBeCloseTo(
        Math.sqrt(p2.x * p2.x + p2.y * p2.y), 6);
      expect(Math.sqrt(p3.x * p3.x + p3.y * p3.y)).toBeCloseTo(
        Math.sqrt(p1.x * p1.x + p1.y * p1.y), 6);
    }
  });
});

// ─────────────────────────────────────────────────────────
// Collision detection
// ─────────────────────────────────────────────────────────
describe('buildModel — collision detection', () => {
  it('no collision when spacing is comfortably larger than tool', () => {
    const m = buildModel(makeParams({
      tool: 3.5, spacing: 20, layers: 4, rawBase: 12,
    }));
    expect(m.badCount).toBe(0);
    expect(m.hasErr).toBe(false);
  });

  it('detects collision when layers are too close (radial)', () => {
    const m = buildModel(makeParams({
      tool: 5, spacing: 3, layers: 4, rawBase: 12,
    }));
    expect(m.badCount).toBeGreaterThan(0);
    expect(m.hasErr).toBe(true);
  });

  it('detects collision when tangential spacing < tool (single layer)', () => {
    // Large n on a small radius → adjacent points closer than tool diameter
    const m = buildModel(makeParams({
      trayD: 60, margin: 5, layers: 1, rawBase: 120, tool: 5,
    }));
    expect(m.badCount).toBeGreaterThan(0);
  });

  it('minD is never greater than tool + clearance when there is at least one collision', () => {
    const m = buildModel(makeParams({
      tool: 5, spacing: 4, layers: 4,
    }));
    if (m.badCount > 0) {
      expect(m.minD).toBeLessThan(5 + SAFETY_CLEARANCE_MM);
    }
  });

  it('minD is exactly the smallest pairwise distance', () => {
    const m = buildModel(makeParams({ layers: 3, rawBase: 9 }));
    let brute = Infinity;
    for (let i = 0; i < m.all.length; i++) {
      for (let j = i + 1; j < m.all.length; j++) {
        const dx = m.all[i].x - m.all[j].x;
        const dy = m.all[i].y - m.all[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < brute) brute = d;
      }
    }
    expect(m.minD).toBeCloseTo(brute, 9);
  });

  it('marked points match those closer than tool diameter + safety clearance', () => {
    const m = buildModel(makeParams({
      tool: 5, spacing: 4, layers: 4,
    }));
    // Every marked point must have at least one neighbour closer than tool + clearance
    for (const pt of m.all) {
      if (!pt.bad) continue;
      let hasClose = false;
      for (const other of m.all) {
        if (other === pt) continue;
        const dx = pt.x - other.x;
        const dy = pt.y - other.y;
        if (Math.sqrt(dx * dx + dy * dy) < (m.toolR * 2 + SAFETY_CLEARANCE_MM) - 1e-9) {
          hasClose = true;
          break;
        }
      }
      expect(hasClose).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────
// Warnings & errors
// ─────────────────────────────────────────────────────────
describe('buildModel — validation', () => {
  it('no warnings for a healthy default config', () => {
    const m = buildModel(makeParams());
    expect(m.hasErr).toBe(false);
    expect(m.hasWarn).toBe(false);
    expect(m.warns).toHaveLength(0);
  });

  it('errors when margin larger than or equal to tray diameter', () => {
    const m = buildModel(makeParams({ trayD: 100, margin: 100 }));
    expect(m.hasErr).toBe(true);
    expect(m.warns.some(w => /الهامش|margin/i.test(w.tx))).toBe(true);
  });

  it('errors when layer radius goes negative', () => {
    const m = buildModel(makeParams({
      trayD: 200, margin: 20, spacing: 100, layers: 4,
    }));
    expect(m.hasErr).toBe(true);
    expect(m.dLast).toBeLessThan(0);
  });

  it('errors when spacing < tool diameter', () => {
    const m = buildModel(makeParams({
      tool: 8, spacing: 5, layers: 4,
    }));
    expect(m.hasErr).toBe(true);
    expect(m.warns.some(w => /التباعد|spacing/i.test(w.tx))).toBe(true);
  });

  it('warns when rawBase is not a multiple of 3', () => {
    const m = buildModel(makeParams({ rawBase: 12, layers: 1 }));
    expect(m.hasWarn).toBe(false);

    const m2 = buildModel(makeParams({ rawBase: 10, layers: 1 }));
    expect(m2.hasWarn).toBe(true);
    expect(m2.layers[0].n).toBe(9);
  });

  it('warns when last layer is too close to center', () => {
    const m = buildModel(makeParams({
      trayD: 200, margin: 5, tool: 4,
      layers: 4, spacing: 23,   // rLast ends up small
    }));
    if (m.rLast >= 0 && m.rLast < m.toolR) {
      expect(m.hasWarn).toBe(true);
    }
  });

  it('sorts errors before warnings', () => {
    const m = buildModel(makeParams({
      trayD: 100, margin: 100, rawBase: 10, layers: 1,
    }));
    expect(m.warns.length).toBeGreaterThan(0);
    // First element must be an error if both kinds exist
    if (m.warns.some(w => w.lv === 'warn')) {
      expect(m.warns[0].lv).toBe('err');
    }
  });
});

// ─────────────────────────────────────────────────────────
// Edge cases
// ─────────────────────────────────────────────────────────
describe('buildModel — edge cases', () => {
  it('works with a single layer', () => {
    const m = buildModel(makeParams({ layers: 1 }));
    expect(m.layers).toHaveLength(1);
    expect(m.totalPts).toBe(12);
  });

  it('works with the maximum number of layers (7)', () => {
    const m = buildModel(makeParams({ layers: 7 }));
    expect(m.layers).toHaveLength(7);
  });

  it('works with the minimum points (3)', () => {
    const m = buildModel(makeParams({ rawBase: 3, layers: 1 }));
    expect(m.layers[0].n).toBe(3);
    expect(m.layers[0].per).toBe(1);
    // 3 points, one per head, 120° apart
    expect(norm360(m.layers[0].pts[1].a - m.layers[0].pts[0].a)).toBeCloseTo(120, 4);
  });

  it('works with the maximum points (120)', () => {
    const m = buildModel(makeParams({
      trayD: 200, margin: 5, tool: 0.5,
      rawBase: 120, layers: 1,
    }));
    expect(m.layers[0].n).toBe(120);
  });

  it('handles a very small tray without crashing', () => {
    const m = buildModel(makeParams({
      trayD: 30, margin: 2, tool: 1,
      layers: 2, spacing: 5,
    }));
    expect(m.R).toBe(15);
    expect(m.totalPts).toBeGreaterThan(0);
  });

  it('handles a very large tray without crashing', () => {
    const m = buildModel(makeParams({
      trayD: 2000, margin: 50, tool: 5,
      layers: 8, spacing: 40,
    }));
    expect(m.R).toBe(1000);
    expect(m.hasErr).toBe(false);
  });

  it('has no duplicate points', () => {
    const m = buildModel(makeParams({ layers: 8, rawBase: 12 }));
    const seen = new Set<string>();
    for (const pt of m.all) {
      const key = `${pt.x.toFixed(6)},${pt.y.toFixed(6)}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });
});

// ─────────────────────────────────────────────────────────
// Property-style invariants (seeded random sweeps)
// ─────────────────────────────────────────────────────────
describe('buildModel — invariants (seeded random)', () => {
  it('totalPts is always a multiple of 3 across many configs', () => {
    const rand = seededRandom(0xC0FFEE);
    for (let trial = 0; trial < 100; trial++) {
      const p = makeParams({
        trayD: 100 + rand() * 400,
        margin: 2 + rand() * 20,
        layers: 1 + Math.floor(rand() * 8),
        spacing: 3 + rand() * 30,
        rawBase: 3 + Math.floor(rand() * 40) * 3,
        tool: 0.5 + rand() * 5,
      });
      const m = buildModel(p);
      expect(m.totalPts % 3).toBe(0);
    }
  });

  it('every point is at distance ≤ R across many configs', () => {
    const rand = seededRandom(0xDEADBEEF);
    for (let trial = 0; trial < 100; trial++) {
      const p = makeParams({
        trayD: 100 + rand() * 400,
        margin: 2 + rand() * 20,
        layers: 1 + Math.floor(rand() * 8),
        spacing: 3 + rand() * 30,
        rawBase: 3 + Math.floor(rand() * 40) * 3,
      });
      const m = buildModel(p);
      for (const pt of m.all) {
        const r = Math.sqrt(pt.x * pt.x + pt.y * pt.y);
        expect(r).toBeLessThanOrEqual(m.R + 1e-6);
      }
    }
  });

  it('all angles always in [0, 360) across many configs', () => {
    const rand = seededRandom(42);
    for (let trial = 0; trial < 100; trial++) {
      const p = makeParams({
        layers: 1 + Math.floor(rand() * 8),
        rawBase: 3 + Math.floor(rand() * 40) * 3,
        addAngle: (rand() - 0.5) * 60,
      });
      const m = buildModel(p);
      for (const pt of m.all) {
        expect(pt.a).toBeGreaterThanOrEqual(0);
        expect(pt.a).toBeLessThan(360);
      }
    }
  });

  it('deterministic: identical inputs → identical outputs', () => {
    const p = makeParams({ layers: 5, rawBase: 15, addAngle: 7.5 });
    const m1 = buildModel(p);
    const m2 = buildModel(p);
    expect(m1.totalPts).toBe(m2.totalPts);
    expect(m1.minD).toBeCloseTo(m2.minD, 12);
    for (let i = 0; i < m1.all.length; i++) {
      expect(m1.all[i].x).toBe(m2.all[i].x);
      expect(m1.all[i].y).toBe(m2.all[i].y);
      expect(m1.all[i].a).toBe(m2.all[i].a);
    }
  });
});

describe('buildModel — mandatory numerical verification', () => {
  it('trayD=500, margin=50, layers=4, spacing=50 yields correct radii and diameters', () => {
    const m = buildModel(makeParams({ trayD: 500, margin: 50, layers: 4, spacing: 50 }));
    expect(m.R).toBe(250);
    expect(m.r1).toBe(200);
    expect(m.d1).toBe(400);
    const expectedR = [200, 150, 100, 50];
    const expectedD = [400, 300, 200, 100];
    for (let i = 0; i < 4; i++) {
      expect(m.layers[i].r).toBeCloseTo(expectedR[i], 6);
      expect(m.layers[i].r * 2).toBeCloseTo(expectedD[i], 6);
    }
  });

  it('calculates spacing correctly from target last layer diameter', () => {
    const trayD = 500;
    const margin = 50;
    const layers = 4;
    const targetDLast = 100;
    const R = trayD / 2;
    const r1 = R - margin;
    const rLast_radius = targetDLast / 2;
    const spacing = (r1 - rLast_radius) / (layers - 1);
    expect(spacing).toBe(50);
  });

  it('trayD=530, margin=70, layers=4, rLast=100 yields correct spacing 145/3 and last layer radius 50', () => {
    const m = buildModel(makeParams({ trayD: 530, margin: 70, layers: 4, rLast: 100 }));
    expect(m.R).toBe(265);
    expect(m.r1).toBe(195);
    expect(m.dLast).toBe(100);
    expect(m.radialStepMm).toBeCloseTo(145 / 3, 6);
    expect(m.layers[3].r).toBe(50);
  });
});

describe('buildModel — machine compatibility modes (Repteur & TableMode)', () => {
  it('default has repteurEnabled=false, all points are fired=true and totalDrilled equals totalPts', () => {
    const m = buildModel(makeParams({ layers: 3, rawBase: 6 }));
    expect(m.totalPts).toBe(18);
    expect(m.totalDrilled).toBe(18);
    expect(m.all.every((p) => p.fired === true)).toBe(true);
  });

  it('repteurEnabled=true with repteurStartPass=true alternates fired state', () => {
    // 2 layers, rawBase=6 -> per=2 steps per layer -> total 4 steps
    // Step 0: pass (fired: true)
    // Step 1: intercept (fired: false)
    // Step 2 (layer 1 step 0): pass (fired: true)
    // Step 3 (layer 1 step 1): intercept (fired: false)
    const m = buildModel(makeParams({
      layers: 2,
      rawBase: 6,
      repteurEnabled: true,
      repteurStartPass: true,
    }));
    expect(m.totalPts).toBe(12);
    expect(m.totalDrilled).toBe(6); // 2 steps * 3 heads = 6 fired holes
    const layer0Pts = m.layers[0].pts;
    // Step j=0 has fired: true, j=1 has fired: false
    expect(layer0Pts.filter((p) => p.j === 0).every((p) => p.fired === true)).toBe(true);
    expect(layer0Pts.filter((p) => p.j === 1).every((p) => p.fired === false)).toBe(true);
  });

  it('repteurEnabled=true with repteurStartPass=false starts by intercepting first stroke', () => {
    const m = buildModel(makeParams({
      layers: 2,
      rawBase: 6,
      repteurEnabled: true,
      repteurStartPass: false,
    }));
    expect(m.totalPts).toBe(12);
    expect(m.totalDrilled).toBe(6);
    const layer0Pts = m.layers[0].pts;
    // First step j=0 intercepted -> fired: false, j=1 passed -> fired: true
    expect(layer0Pts.filter((p) => p.j === 0).every((p) => p.fired === false)).toBe(true);
    expect(layer0Pts.filter((p) => p.j === 1).every((p) => p.fired === true)).toBe(true);
  });

  it('tableMode=continue accumulates offsets across custom layers', () => {
    const mReset = buildModel(makeParams({
      mode: 'custom',
      layers: 3,
      custom: [
        { n: 6, off: 10 },
        { n: 6, off: 20 },
        { n: 6, off: 30 },
      ],
      tableMode: 'reset',
    }));
    expect(mReset.layers[0].off).toBe(10);
    expect(mReset.layers[1].off).toBe(20);
    expect(mReset.layers[2].off).toBe(30);

    const mContinue = buildModel(makeParams({
      mode: 'custom',
      layers: 3,
      custom: [
        { n: 6, off: 10 },
        { n: 6, off: 20 },
        { n: 6, off: 30 },
      ],
      tableMode: 'continue',
    }));
    expect(mContinue.layers[0].off).toBe(10);
    expect(mContinue.layers[1].off).toBe(30); // 10 + 20
    expect(mContinue.layers[2].off).toBe(60); // 10 + 20 + 30
  });
});
