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

  it('tableMode=continue: inter-layer repos is purely radial (th0 === th1) and preserves angle continuity', () => {
    const m = buildModel(makeParams({
      layers: 3,
      rawBase: 12,
      addAngle: 10,
      tableMode: 'continue',
    }));
    const tl = buildTimeline(m, makeTiming());
    const reposActs = tl.acts.filter((a) => a.type === 'repos');

    expect(reposActs).toHaveLength(3);
    // Layer 0 starts at -off
    expect(reposActs[0].layer).toBe(0);

    // Layers > 0 have purely radial repos transitions (no turntable rotation)
    for (let i = 1; i < reposActs.length; i++) {
      const rAct = reposActs[i];
      expect(rAct.th0).toBeCloseTo(rAct.th1, 4); // Pure radial motion!
      expect(rAct.r0).not.toBe(rAct.r1); // Radius changes
    }

    // Verify index count: exactly (per - 1) per layer without artificial jumps
    const indexActs = tl.acts.filter((a) => a.type === 'index');
    expect(indexActs).toHaveLength((4 - 1) * 3); // 3 layers, per=4 each -> 3 * 3 = 9
  });

  it('tableMode=continue: override parameter takes precedence', () => {
    const m = buildModel(makeParams({
      layers: 2,
      rawBase: 12,
      addAngle: 15,
      tableMode: 'reset',
    }));
    // Overriding tableMode to continue
    const tlContinue = buildTimeline(m, makeTiming(), 'continue');
    const reposActs = tlContinue.acts.filter((a) => a.type === 'repos');
    expect(reposActs[1].th0).toBeCloseTo(reposActs[1].th1, 4);

    // Overriding tableMode to reset
    const mCont = buildModel(makeParams({
      layers: 2,
      rawBase: 12,
      addAngle: 15,
      tableMode: 'continue',
    }));
    const tlReset = buildTimeline(mCont, makeTiming(), 'reset');
    const reposReset = tlReset.acts.filter((a) => a.type === 'repos');
    expect(reposReset[1].th1).toBeCloseTo(-mCont.layers[1].off, 4);
  });

  it('tableMode=continue: final stateAt does not snap back to lastLayer.off', () => {
    const m = buildModel(makeParams({
      layers: 2,
      rawBase: 12,
      addAngle: 15,
      tableMode: 'continue',
    }));
    const tl = buildTimeline(m, makeTiming());
    const finalState = stateAt(tl.total, tl, m);
    expect(finalState.done).toBe(true);
    // The final theta should match the last action's th1, not forced to -lastLayer.off
    const lastAct = tl.acts[tl.acts.length - 1];
    expect(finalState.theta).toBeCloseTo(lastAct.th1, 4);
  });

  it('repteurEnabled: timeline fire actions have fired alternating matching stroke mask', () => {
    const m = buildModel(makeParams({
      layers: 1,
      rawBase: 12, // per = 4
      repteurEnabled: true,
      repteurStartPass: true,
    }));
    const tl = buildTimeline(m, makeTiming());
    const fireActs = tl.acts.filter((a) => a.type === 'fire');

    expect(fireActs).toHaveLength(4);
    expect(fireActs[0].fired).toBe(true);  // step 0 passes
    expect(fireActs[1].fired).toBe(false); // step 1 intercepted
    expect(fireActs[2].fired).toBe(true);  // step 2 passes
    expect(fireActs[3].fired).toBe(false); // step 3 intercepted
  });

  it('tableMode=reset: inter-layer repos returns table to absolute -L.off', () => {
    const m = buildModel(makeParams({
      layers: 3,
      rawBase: 12,
      addAngle: 10,
      tableMode: 'reset',
    }));
    const tl = buildTimeline(m, makeTiming());
    const reposActs = tl.acts.filter((a) => a.type === 'repos');

    expect(reposActs[1].th1).toBeCloseTo(-m.layers[1].off, 4);
    expect(reposActs[2].th1).toBeCloseTo(-m.layers[2].off, 4);
  });

  it('tableMode=continue: first fire in subsequent layer directly matches model layer off/phase without index step', () => {
    const m = buildModel(makeParams({
      layers: 3,
      rawBase: 12,
      addAngle: 0,
      tableMode: 'continue',
    }));
    const tl = buildTimeline(m, makeTiming());

    // Layer 0: first fire at th = -m.layers[0].off = 0
    const fireL0First = tl.acts.find((a) => a.type === 'fire' && a.layer === 0 && a.j === 0);
    expect(fireL0First).toBeDefined();
    expect(fireL0First?.th0).toBeCloseTo(-m.layers[0].off, 4);

    // Layer 1: first fire at th = -m.layers[1].off = -90° (table angle -90° aligns hole at +90° with head 0)
    const fireL1First = tl.acts.find((a) => a.type === 'fire' && a.layer === 1 && a.j === 0);
    expect(fireL1First).toBeDefined();
    expect(fireL1First?.th0).toBeCloseTo(-m.layers[1].off, 4);

    // Layer 2: first fire at th = -m.layers[2].off = -180°
    const fireL2First = tl.acts.find((a) => a.type === 'fire' && a.layer === 2 && a.j === 0);
    expect(fireL2First).toBeDefined();
    expect(fireL2First?.th0).toBeCloseTo(-m.layers[2].off, 4);
  });
});
