import { TrayParams, TrayModel, Layer, Point, Warn, TrayTiming } from '../types';
import { DEG } from './constants';
import { ease, fmtTime } from './timeline';

export { ease, fmtTime };
export type Timing = TrayTiming;
export type ModelParams = Partial<TrayParams> & {
  trayD: number;
  tool: number;
  margin: number;
  layers: number;
  spacing: number;
  mode: 'all' | 'custom' | 'machine';
  rawBase: number;
  addAngle: number;
  custom: Array<{ n: number; off: number; stepAngle?: number }>;
  t?: TrayTiming;
  timing?: TrayTiming;
};

export const clamp = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v));

export const clampInt = (v: number, min: number, max: number): number =>
  clamp(Math.round(v), min, max);

export const norm360 = (a: number): number => {
  a %= 360;
  return a < 0 ? a + 360 : a;
};

export const toMm = (v: number, unit: 'cm' | 'mm'): number =>
  unit === 'cm' ? v * 10 : v;

/**
 * Industrial safety clearance (in mm) between hole edges to prevent
 * drill bit collision, workpiece tear-out, and material weakness.
 */
export const SAFETY_CLEARANCE_MM = 0.5;

/**
 * Sanitize point count for a 3-synchronized-head machine.
 * Because 3 drill heads are spaced at 120° apart (0°, 120°, 240°),
 * each head covers an arc of 120°. A complete symmetric pattern
 * requires that the total hole count N is a multiple of 3,
 * where each head drills exactly N/3 holes spaced by 360°/N = 120°/(N/3).
 */
export const sanitizeN = (n: number, enforceMultipleOf3 = true): number => {
  const val = Number.isNaN(n) ? 12 : n;
  if (!enforceMultipleOf3) {
    return clamp(Math.round(val), 3, 120);
  }
  return clamp(Math.round(val / 3) * 3, 3, 120);
};

export const fmt = (v: number, d = 1): string => {
  const s = (Math.abs(v) < 1e-9 ? 0 : v).toFixed(d);
  return /^-(0+(\.0+)?)$/.test(s) ? s.slice(1) : s;
};

// RADIUS-ONLY pipeline
export function buildModel(p: ModelParams): TrayModel {
  const R = p.trayD / 2;
  const toolR = p.tool / 2;
  const margin = p.margin; // مسافة شعاعية جهة واحدة
  const r1 = Math.max(0, R - margin);
  const d1 = 2 * r1; // للعرض فقط
  const activeLayersCount = clampInt(p.layers, 1, 7);

  const rLastRUnclamped =
    p.rLast !== undefined
      ? p.rLast / 2
      : r1 - (p.spacing || 0) * (activeLayersCount - 1);
  const rLastR = Math.max(0, rLastRUnclamped);
  const radialStepMm =
    activeLayersCount > 1 ? (r1 - rLastR) / (activeLayersCount - 1) : 0;
  const rLast = rLastR;
  const dLast = 2 * rLastRUnclamped;

  const layers: Layer[] = [];
  const all: Point[] = [];
  const warns: Warn[] = [];

  // Machine modes setup
  const repteurEnabled = Boolean(p.repteurEnabled);
  let repteurPass = p.repteurStartPass !== false;
  let accumulatedOff = 0;
  let prevPer = 0;
  let prevStep = 0;

  for (let i = 0; i < activeLayersCount; i++) {
    // For the last layer, use rLastR strictly to avoid floating point drift
    const r =
      i === activeLayersCount - 1
        ? rLastR
        : Math.max(0, r1 - radialStepMm * i);
    const d = 2 * r;
    let rawN: number;
    let off: number;
    let step: number;
    let n: number;

    // لأن الآلة تحتوي على 3 رؤوس متزامنة بزاوية 120°، يجب أن يكون عدد النقاط مضاعفاً لـ 3.
    // لذلك نُعيد دائماً حساب step = 360 / n بعد sanitizeN لضمان إغلاق الدائرة بدقة.
    if (p.mode === 'all') {
      rawN = p.rawBase;
      const stepOff = p.addAngle;
      const nClean = sanitizeN(rawN);
      n = nClean;
      step = 360 / nClean;

      if (p.tableMode === 'continue') {
        if (i === 0) {
          accumulatedOff = 0;
        } else {
          // Angular phase chaining (DCA04): table stops at the angle of the last stroke of previous layer.
          // The table performed (prevPer - 1) index steps of prevStep each.
          // Any explicit incremental addAngle is added on top of the continuous angular phase.
          accumulatedOff += (prevPer - 1) * prevStep + (stepOff || 0);
        }
        off = accumulatedOff;
      } else {
        off = i * stepOff;
      }
    } else {
      // custom or machine mode
      const cfg = p.custom[i] || { n: p.rawBase, off: i * p.addAngle };
      const layerOff = cfg.off || 0;

      if (cfg.stepAngle && cfg.stepAngle > 0) {
        rawN = Math.round(360 / cfg.stepAngle);
        n = sanitizeN(rawN);
        step = 360 / n;
      } else {
        rawN = cfg.n || p.rawBase;
        n = sanitizeN(rawN);
        step = 360 / n;
      }

      if (p.tableMode === 'continue') {
        if (i === 0) {
          accumulatedOff = layerOff;
        } else {
          accumulatedOff += (prevPer - 1) * prevStep + layerOff;
        }
        off = accumulatedOff;
      } else {
        off = layerOff;
      }
    }

    const per = n / 3;
    prevPer = per;
    prevStep = step;

    if (Math.round(rawN) !== n) {
      warns.push({
        lv: 'warn',
        tx: `الطبقة L${i + 1}: عدد النقاط ${rawN} ليس مضاعفاً لـ 3 — تم تعديله تلقائياً إلى ${n}.`,
      });
    }

    // Repteur stroke mask mapping per index step j
    const strokePassMap: Record<number, boolean> = {};
    for (let j = 0; j < per; j++) {
      if (repteurEnabled) {
        strokePassMap[j] = repteurPass;
        repteurPass = !repteurPass;
      } else {
        strokePassMap[j] = true;
      }
    }

    const pts: Point[] = [];
    for (let k = 0; k < n; k++) {
      const a = norm360(k * step + off);
      const rad = a * DEG;
      const j = k % per;
      const isFired = strokePassMap[j] !== undefined ? strokePassMap[j] : true;
      pts.push({
        layer: i,
        k,
        head: Math.floor(k / per),
        j,
        a,
        x: r * Math.cos(rad),
        y: r * Math.sin(rad),
        bad: false,
        fired: isFired,
      });
    }

    layers.push({
      i,
      r,
      n,
      per,
      step,
      off,
      pts,
      minD: Infinity,
      bad: 0,
    });

    for (const q of pts) {
      all.push(q);
    }
  }

  // Exact pairwise clearance calculation (Euclidean distance between drilled hole centers)
  let minD = Infinity;
  let badCount = 0;
  const thr = p.tool + SAFETY_CLEARANCE_MM - 1e-6; // clearance threshold = tool diameter + safety clearance

  for (let a = 0; a < all.length; a++) {
    const A = all[a];
    if (A.fired === false) continue; // ثقب معترض بقناع Repteur
    for (let b = a + 1; b < all.length; b++) {
      const B = all[b];
      if (B.fired === false) continue; // ثقب معترض بقناع Repteur
      const dx = A.x - B.x;
      const dy = A.y - B.y;
      const d = Math.sqrt(dx * dx + dy * dy);

      if (d < minD) minD = d;

      const LA = layers[A.layer];
      const LB = layers[B.layer];
      if (d < LA.minD) LA.minD = d;
      if (d < LB.minD) LB.minD = d;

      if (d < thr) {
        A.bad = true;
        B.bad = true;
      }
    }
  }

  for (const q of all) {
    if (q.bad) {
      badCount++;
      layers[q.layer].bad++;
    }
  }

  // Geometry and physical limit validations based on diameter and margin
  // rLast and dLast already defined above from rLastR
  const dLastVal = 2 * rLastR;

  if (d1 <= 0) {
    warns.push({
      lv: 'err',
      tx: `الهامش (${fmt(p.margin)} مم) أكبر من أو يساوي قطر الصينية (${fmt(p.trayD)} مم) — لا توجد مساحة للطبقة الأولى.`,
    });
  } else if (r1 + toolR > R + 1e-9) {
    warns.push({
      lv: 'err',
      tx: `الهامش (${fmt(p.margin)} مم) أصغر من نصف قطر الأداة (${fmt(toolR)} مم): سن الحفر يتجاوز محيط الصينية الخارجي.`,
    });
  }

  if (p.layers > 1 && radialStepMm < p.tool + SAFETY_CLEARANCE_MM - 1e-9) {
    warns.push({
      lv: 'err',
      tx: `التباعد الشعاعي بين الحلقات (${fmt(radialStepMm)} مم) أقل من قطر الأداة مع خلوص الأمان (${fmt(p.tool + SAFETY_CLEARANCE_MM, 2)} مم): يحدث تداخل وتصادم بين الدوائر متحدة المركز.`,
    });
  }

  if (dLast < 0) {
    warns.push({
      lv: 'err',
      tx: `قطر الطبقة الأخيرة سالب (${fmt(dLast)} مم) — تتجاوز المركز! قلل التباعد أو عدد الطبقات.`,
    });
  } else if (dLast < p.tool && d1 > 0) {
    warns.push({
      lv: 'warn',
      tx: `قطر الطبقة الأخيرة (${fmt(dLast)} مم) أصغر من قطر الأداة (${fmt(p.tool)} مم) — قريبة جداً من نقطة المركز.`,
    });
  }

  if (badCount > 0) {
    const affected = layers
      .filter((l) => l.bad > 0)
      .map((l) => 'L' + (l.i + 1))
      .join('، ');
    warns.push({
      lv: 'err',
      tx: `يوجد تداخل بين ${badCount} نقطة (أدنى مسافة ${fmt(minD, 2)} مم < قطر الأداة ${fmt(p.tool)} مم + خلوص أمان ${fmt(SAFETY_CLEARANCE_MM, 1)} مم = ${fmt(p.tool + SAFETY_CLEARANCE_MM, 2)} مم) في الطبقات: ${affected}.`,
    });
  }

  // Sort errors first, then warnings
  warns.sort((a, b) => {
    const weight = { err: 0, warn: 1 };
    return weight[a.lv] - weight[b.lv];
  });

  const totalPts = all.length;
  const totalDrilled = all.filter((pt) => pt.fired !== false).length;
  const totalSteps = layers.reduce((s, l) => s + l.per, 0);

  return {
    R,
    toolR,
    r1,
    rLast,
    d1,
    dLast,
    radialStepMm,
    layers,
    all,
    minD: isFinite(minD) ? minD : 0,
    badCount,
    warns,
    totalPts,
    totalDrilled,
    totalSteps,
    tableMode: p.tableMode || 'reset',
    hasErr: warns.some((w) => w.lv === 'err'),
    hasWarn: warns.some((w) => w.lv === 'warn'),
  };
}

export function extractMachineRows(model: TrayModel, _p?: TrayParams) {
  const rows = [];
  const maxMachineLayers = 7;

  for (let i = 0; i < maxMachineLayers; i++) {
    const layer = model.layers[i];
    const isLayerActive = i < model.layers.length && layer && layer.r > 0;

    let rotationAngle = 0;
    let add = 0;

    if (isLayerActive) {
      rotationAngle = Number(layer.step.toFixed(1));
      add = Number(layer.off.toFixed(1));
    }

    rows.push({
      layer: i + 1,
      rotationAngle,
      add,
      active: isLayerActive,
      holesCount: isLayerActive ? layer.n : 0,
      holesPerHead: isLayerActive ? layer.per : 0,
    });
  }

  return rows;
}

export function calculateTouchWinProcessingTime(model: TrayModel, p: TrayParams): number {
  if (model.layers.length === 0) return 0;

  const dwellSec = p.timing.dwell / 1000; // e.g. 0.10s
  const rotHz = p.rotationSpeedHz || 800;
  const expHz = p.expansionSpeedHz || 800;
  const ppr = p.pulsesPerRev || 10000;
  const ppm = p.pulsesPerMm || 100;

  // Machine mechanical settling & ramp overheads (configurable or calibrated defaults)
  const expRamp = p.timing.rampExpansionSec !== undefined ? p.timing.rampExpansionSec : 0.08;
  const rotRamp = p.timing.rampRotationSec !== undefined ? p.timing.rampRotationSec : 0.035;

  let totalSec = 0;

  // 1. Initial positioning
  const firstExpansionSec = (p.spacing * ppm) / expHz + expRamp;
  totalSec += Math.min(firstExpansionSec, 0.4);

  // 2. Each layer execution
  model.layers.forEach((L, idx) => {
    // Inter-layer expansion
    if (idx > 0) {
      const expTimeSec = (p.spacing * ppm) / expHz + expRamp;
      totalSec += Math.min(expTimeSec, 0.35);
    }

    // Step rotations + drill dwells
    const stepPulses = (L.step * (ppr / 360));
    const rotTimePerStepSec = stepPulses / rotHz + rotRamp; // pulses + mechanical ramp

    // Each head does L.per holes:
    // Holes drill time
    totalSec += L.per * dwellSec;
    // Rotation between holes (per - 1 steps)
    if (L.per > 1) {
      totalSec += (L.per - 1) * rotTimePerStepSec;
    }
  });

  return Number(totalSec.toFixed(2));
}
