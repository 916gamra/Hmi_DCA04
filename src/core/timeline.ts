import { TrayModel, TrayTiming, Timeline, TimelineAction, SimulationState } from '../types';

export const ease = (u: number): number =>
  u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u);

export function fmtTime(ms: number): string {
  const s = ms / 1000;
  if (s >= 60) {
    const mins = Math.floor(s / 60);
    const secs = Math.round(s % 60);
    return `${mins}د ${secs}ث`;
  }
  return `${s.toFixed(1)} ث`;
}

/**
 * TRIVIUM DCA04 Machine Timeline Generator
 *
 * Rules for Table Modes (قواعد أوضاع الطاولة):
 * 1. reset (Default / وضع إعادة الصفر المطلق):
 *    - Each layer has an absolute angular reference offset: thS = -L.off.
 *    - On layer repositioning (repos), the turntable rotates directly to thS = -L.off,
 *      and the radial drill carriage moves to L.r.
 *
 * 2. continue (Real DCA04 machine behavior / وضع الاستمرار الزاوي للآلة):
 *    - Layer 0 sets initial radial position r0 and starting turntable angle thS = -L0.off.
 *    - Between layer i and layer i+1:
 *      * Reposition action changes RADIAL coordinate only (r0 -> r1 = L.r).
 *      * Turntable angle is stationary: th1 = th0 (حركة شعاعية فقط: لا دوران لإعادة الصفر ولا قفزة إلى -L.off).
 *      * Indexing inside the next layer continues smoothly from the current theta by -L.step.
 *    - Physical continuity of turntable rotation is strictly preserved.
 */
export function buildTimeline(
  m: TrayModel,
  tm?: TrayTiming,
  overrideTableMode?: 'reset' | 'continue'
): Timeline {
  const tableMode = overrideTableMode || m.tableMode || 'reset';
  const acts: TimelineAction[] = [];
  let t = 0;
  let th = 0;
  let rr = m.R;

  const dLayer = tm && typeof tm.layer === 'number' && tm.layer > 0 ? tm.layer : 400;
  const dIndex = tm && typeof tm.index === 'number' && tm.index > 0 ? tm.index : 120;
  const dDwell = tm && typeof tm.dwell === 'number' && tm.dwell > 0 ? tm.dwell : 100;

  m.layers.forEach((L, i) => {
    // 1. Reposition drill heads radially to layer radius
    if (i === 0) {
      const thS = -L.off;
      acts.push({
        type: 'repos',
        t0: t,
        d: dLayer,
        layer: i,
        r0: rr,
        r1: L.r,
        th0: th,
        th1: thS,
      });
      t += dLayer;
      rr = L.r;
      th = thS;
    } else if (tableMode === 'continue') {
      // In continue mode (DCA04): purely radial carriage movement between layers (حركة شعاعية فقط)
      // θ1 = θ0: Turntable angle remains completely stationary during repos (no angular reset, no jump to -L.off)
      acts.push({
        type: 'repos',
        t0: t,
        d: dLayer,
        layer: i,
        r0: rr,
        r1: L.r,
        th0: th,
        th1: th,
      });
      t += dLayer;
      rr = L.r;
    } else {
      // Standard reset mode: return table to absolute layer start offset
      const thS = -L.off;
      acts.push({
        type: 'repos',
        t0: t,
        d: dLayer,
        layer: i,
        r0: rr,
        r1: L.r,
        th0: th,
        th1: thS,
      });
      t += dLayer;
      rr = L.r;
      th = thS;
    }

    // 2. Drill all points for each head in this layer
    for (let j = 0; j < L.per; j++) {
      if (j > 0) {
        // Rotate tray index step
        const th1 = th - L.step;
        acts.push({
          type: 'index',
          t0: t,
          d: dIndex,
          layer: i,
          j,
          r0: L.r,
          r1: L.r,
          th0: th,
          th1,
        });
        t += dIndex;
        th = th1;
      }

      // Synchronized drill fire (all 3 heads simultaneously plunge and retract)
      const isFired = L.pts.length > 0 ? L.pts.some((pt) => pt.j === j && pt.fired !== false) : true;
      acts.push({
        type: 'fire',
        t0: t,
        d: dDwell,
        layer: i,
        j,
        r0: L.r,
        r1: L.r,
        th0: th,
        th1: th,
        fired: isFired,
      });
      t += dDwell;
    }
  });

  // Ensure final state returns to -lastLayer.off at end of cycle
  return { acts, total: Math.max(t, 100) };
}

export function stateAt(t: number, timeline: Timeline, model: TrayModel): SimulationState {
  const acts = timeline.acts;
  const counts = new Array(model.layers.length).fill(0);
  let theta = 0;
  let headR = model.R;
  let cur: TimelineAction | null = null;
  let u = 0;
  let done = false;

  for (let q = 0; q < acts.length; q++) {
    const a = acts[q];
    if (t >= a.t0 + a.d) {
      theta = a.th1;
      headR = a.r1;
      if (a.type === 'fire' && a.j !== undefined) {
        // counts[layer] tracks machine indexing stroke progress (j + 1) across the layer.
        // Physical and visual drilling (isDrilled) is strictly governed by pt.fired !== false
        // (in render.ts and SimulationControls.tsx). If a.fired === false, Repteur intercepts
        // the stroke, rendering a dashed ghost stroke and never filling the hole.
        counts[a.layer] = a.j + 1;
      }
      if (q === acts.length - 1) {
        done = true;
        cur = a;
        if (model.tableMode !== 'continue' && model.layers.length > 0) {
          theta = -model.layers[model.layers.length - 1].off;
        }
      }
    } else {
      if (t >= a.t0) {
        u = (t - a.t0) / a.d;
        const e = a.type === 'fire' ? u : ease(u);
        theta = a.th0 + (a.th1 - a.th0) * e;
        headR = a.r0 + (a.r1 - a.r0) * e;
        if (a.type === 'fire' && a.j !== undefined) {
          counts[a.layer] = a.j + 1;
        }
        cur = a;
      }
      break;
    }
  }

  return { theta, headR, counts, cur, u, done };
}
