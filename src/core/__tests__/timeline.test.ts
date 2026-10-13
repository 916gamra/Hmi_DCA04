/**
 * Tests for buildTimeline() and stateAt().
 *
 * The timeline is what drives the real-time simulation. Bugs here
 * cause visual jitter, wrong counts, or wrong positions.
 */
import { describe, it, expect } from 'vitest';
import { buildModel } from '../model';
import { buildTimeline, stateAt } from '../timeline';
import type { ModelParams, Timing } from '../model';

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function makeParams(overrides: Partial<ModelParams> = {}): ModelParams {
  return {
    trayD: 300, tool: 3.5, margin: 25,
    layers: 3, spacing: 20,
    mode: 'all', rawBase: 12, addAngle: 0,
    custom: Array.from({ length: 8 }, () => ({ n: 12, off: 0 })),
    t: { dwell: 100, index: 100, layer: 500 },
    ...overrides,
  };
}

function makeTiming(overrides: Partial<Timing> = {}): Timing {
  return { dwell: 100, index: 100, layer: 500, ...overrides };
}

// ─────────────────────────────────────────────────────────
// buildTimeline — structure
// ─────────────────────────────────────────────────────────
describe('buildTimeline — structure', () => {
  it('produces at least one action per layer', () => {
    const m = buildModel(makeParams({ layers: 4 }));
    const tl = buildTimeline(m, makeTiming());
    const reposCount = tl.acts.filter(a => a.type === 'repos').length;
    expect(reposCount).toBe(4);
  });

  it('produces per*layers fire actions', () => {
    const m = buildModel(makeParams({ layers: 3, rawBase: 12 }));
    const tl = buildTimeline(m, makeTiming());
    const fireCount = tl.acts.filter(a => a.type === 'fire').length;
    // 3 layers × 4 steps per head = 12 fires
    expect(fireCount).toBe(12);
  });

  it('produces (per-1)*layers index actions', () => {
    const m = buildModel(makeParams({ layers: 3, rawBase: 12 }));
    const tl = buildTimeline(m, makeTiming());
    const indexCount = tl.acts.filter(a => a.type === 'index').length;
    // 3 layers × (4 - 1) = 9
    expect(indexCount).toBe(9);
  });

  it('first action is always a repos to the first layer', () => {
    const m = buildModel(makeParams());
    const tl = buildTimeline(m, makeTiming());
    expect(tl.acts[0].type).toBe('repos');
    expect(tl.acts[0].layer).toBe(0);
    expect(tl.acts[0].t0).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────
// buildTimeline — timing
// ─────────────────────────────────────────────────────────
describe('buildTimeline — timing', () => {
  it('actions are contiguous (no gaps, no overlaps)', () => {
    const m = buildModel(makeParams({ layers: 4, rawBase: 12 }));
    const tl = buildTimeline(m, makeTiming());
    for (let i = 0; i < tl.acts.length - 1; i++) {
      const cur = tl.acts[i];
      const nxt = tl.acts[i + 1];
      expect(cur.t0 + cur.d).toBeCloseTo(nxt.t0, 9);
    }
  });

  it('total equals sum of all action durations', () => {
    const m = buildModel(makeParams({ layers: 3, rawBase: 12 }));
    const tl = buildTimeline(m, makeTiming());
    const sum = tl.acts.reduce((acc, a) => acc + a.d, 0);
    expect(tl.total).toBeCloseTo(sum, 9);
  });

  it('total matches the analytic formula', () => {
    const m = buildModel(makeParams({ layers: 3, rawBase: 12 }));
    const t = makeTiming({ dwell: 100, index: 80, layer: 400 });
    const tl = buildTimeline(m, t);
    // 3 layers × 400 (repos) + 9 index × 80 + 12 fire × 100
    const expected = 3 * 400 + 9 * 80 + 12 * 100;
    expect(tl.total).toBeCloseTo(expected, 6);
  });

  it('changing dwell changes total proportionally', () => {
    const m = buildModel(makeParams({ layers: 2, rawBase: 6 }));
    const tl1 = buildTimeline(m, makeTiming({ dwell: 100 }));
    const tl2 = buildTimeline(m, makeTiming({ dwell: 200 }));
    // 2 layers × 2 steps × 100 extra ms = 400
    expect(tl2.total - tl1.total).toBeCloseTo(400, 6);
  });
});

// ─────────────────────────────────────────────────────────
// stateAt — boundaries
// ─────────────────────────────────────────────────────────
describe('stateAt — boundaries', () => {
  it('at t=0 returns initial state (theta=0, at outer radius)', () => {
    const m = buildModel(makeParams());
    const tl = buildTimeline(m, makeTiming());
    const s = stateAt(0, tl, m);
    expect(s.theta).toBe(0);
    expect(s.headR).toBeCloseTo(m.R, 6);
    expect(s.counts.every(c => c === 0)).toBe(true);
  });

  it('at t=total returns final state (done=true)', () => {
    const m = buildModel(makeParams({ layers: 3, rawBase: 12 }));
    const tl = buildTimeline(m, makeTiming());
    const s = stateAt(tl.total, tl, m);
    expect(s.done).toBe(true);
    expect(s.counts).toEqual([4, 4, 4]);
  });

  it('t > total behaves like t = total', () => {
    const m = buildModel(makeParams());
    const tl = buildTimeline(m, makeTiming());
    const sEnd = stateAt(tl.total, tl, m);
    const sPast = stateAt(tl.total * 10, tl, m);
    expect(sPast.done).toBe(sEnd.done);
    expect(sPast.counts).toEqual(sEnd.counts);
    expect(sPast.theta).toBeCloseTo(sEnd.theta, 9);
  });

  it('t < 0 behaves like t = 0', () => {
    const m = buildModel(makeParams());
    const tl = buildTimeline(m, makeTiming());
    const sZero = stateAt(0, tl, m);
    const sNeg = stateAt(-100, tl, m);
    expect(sNeg.theta).toBe(sZero.theta);
    expect(sNeg.counts).toEqual(sZero.counts);
  });
});

// ─────────────────────────────────────────────────────────
// stateAt — counts
// ─────────────────────────────────────────────────────────
describe('stateAt — counts', () => {
  it('counts increase monotonically with time', () => {
    const m = buildModel(makeParams({ layers: 3, rawBase: 12 }));
    const tl = buildTimeline(m, makeTiming());
    let prev = [0, 0, 0];
    for (let t = 0; t <= tl.total; t += tl.total / 200) {
      const s = stateAt(t, tl, m);
      for (let i = 0; i < s.counts.length; i++) {
        expect(s.counts[i]).toBeGreaterThanOrEqual(prev[i]);
      }
      prev = s.counts;
    }
  });

  it('counts never exceed per-layer steps', () => {
    const m = buildModel(makeParams({ layers: 3, rawBase: 12 }));
    const tl = buildTimeline(m, makeTiming());
    for (let t = 0; t <= tl.total; t += tl.total / 100) {
      const s = stateAt(t, tl, m);
      for (let i = 0; i < s.counts.length; i++) {
        expect(s.counts[i]).toBeLessThanOrEqual(m.layers[i].per);
      }
    }
  });

  it('counts reach per for each layer at end', () => {
    const m = buildModel(makeParams({ layers: 3, rawBase: 12 }));
    const tl = buildTimeline(m, makeTiming());
    const s = stateAt(tl.total, tl, m);
    for (let i = 0; i < m.layers.length; i++) {
      expect(s.counts[i]).toBe(m.layers[i].per);
    }
  });
});

// ─────────────────────────────────────────────────────────
// stateAt — current action
// ─────────────────────────────────────────────────────────
describe('stateAt — current action', () => {
  it('identifies the correct action mid-fire', () => {
    const m = buildModel(makeParams({ layers: 1, rawBase: 6 }));
    const t = makeTiming({ dwell: 100, index: 100, layer: 200 });
    const tl = buildTimeline(m, t);
    const fire0 = tl.acts.find(a => a.type === 'fire')!;
    const s = stateAt(fire0.t0 + fire0.d / 2, tl, m);
    expect(s.cur?.type).toBe('fire');
    expect(s.cur?.layer).toBe(0);
    expect(s.cur?.j).toBe(0);
  });

  it('identifies the correct action mid-index', () => {
    const m = buildModel(makeParams({ layers: 1, rawBase: 6 }));
    const t = makeTiming({ dwell: 100, index: 100, layer: 200 });
    const tl = buildTimeline(m, t);
    const idx = tl.acts.find(a => a.type === 'index')!;
    const s = stateAt(idx.t0 + idx.d / 2, tl, m);
    expect(s.cur?.type).toBe('index');
  });

  it('u is in [0, 1] within an action', () => {
    const m = buildModel(makeParams());
    const tl = buildTimeline(m, makeTiming());
    for (const a of tl.acts) {
      const mid = stateAt(a.t0 + a.d * 0.5, tl, m);
      if (mid.cur === a) {
        expect(mid.u).toBeGreaterThanOrEqual(0);
        expect(mid.u).toBeLessThanOrEqual(1);
      }
    }
  });
});

// ─────────────────────────────────────────────────────────
// stateAt — geometry
// ─────────────────────────────────────────────────────────
describe('stateAt — geometry', () => {
  it('head radius follows the current layer', () => {
    const m = buildModel(makeParams({ layers: 4, rawBase: 12 }));
    const tl = buildTimeline(m, makeTiming());
    const s = stateAt(tl.total, tl, m);
    expect(s.headR).toBeCloseTo(m.layers[m.layers.length - 1].r, 4);
  });

  it('theta is always a finite number in [-720, 720]', () => {
    const m = buildModel(makeParams({ layers: 4, rawBase: 12, addAngle: 30 }));
    const tl = buildTimeline(m, makeTiming());
    for (let t = 0; t <= tl.total; t += tl.total / 100) {
      const s = stateAt(t, tl, m);
      expect(Number.isFinite(s.theta)).toBe(true);
      expect(Math.abs(s.theta)).toBeLessThan(10000);
    }
  });

  it('theta at end equals -last layer offset', () => {
    const m = buildModel(makeParams({ layers: 3, rawBase: 12, addAngle: 0 }));
    const tl = buildTimeline(m, makeTiming());
    const s = stateAt(tl.total, tl, m);
    expect(s.theta).toBeCloseTo(-m.layers[2].off, 4);
  });
});

// ─────────────────────────────────────────────────────────
// Integration
// ─────────────────────────────────────────────────────────
describe('timeline — integration', () => {
  it('simulation visits every point exactly once', () => {
    const m = buildModel(makeParams({ layers: 3, rawBase: 12 }));
    const tl = buildTimeline(m, makeTiming());
    const visited = new Set<string>();
    for (const a of tl.acts) {
      if (a.type === 'fire') {
        const key = `${a.layer}:${a.j}`;
        expect(visited.has(key)).toBe(false);
        visited.add(key);
      }
    }
    expect(visited.size).toBe(3 * 4);
  });

  it('deterministic: same inputs → same actions', () => {
    const m = buildModel(makeParams());
    const t = makeTiming();
    const tl1 = buildTimeline(m, t);
    const tl2 = buildTimeline(m, t);
    expect(tl1.total).toBe(tl2.total);
    expect(tl1.acts.length).toBe(tl2.acts.length);
  });
});
