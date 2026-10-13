import { TrayParams, TrayModel, Timeline } from '../types';
import { HEADS } from './constants';
import {
  parseRecipeV1,
  serializeRecipeV1,
  validateRecipeParams,
  normalizeAndHydrateParams,
  formatRecipeErrorsList,
  RecipeErrorCode,
} from './recipeFormat';
import type { ModelParams } from './model';

export {
  parseRecipeV1,
  serializeRecipeV1,
  validateRecipeParams,
  normalizeAndHydrateParams,
  formatRecipeErrorsList,
};
export type { RecipeErrorCode };

export const MACHINE_LAYER_LIMIT = 7;

export interface MachineRecipeExtras {
  rotSpeedHz: number;
  expSpeedHz: number;
  deflowerTimeS: number;
}

export interface RecipeTextOutput {
  angleLines: string[];
  autoLines: string[];
  full: string;
}

export function buildRecipeText(
  model: TrayModel,
  p: ModelParams,
  tl: Timeline,
  extras?: Partial<MachineRecipeExtras>
): RecipeTextOutput {
  const rotSpeedHz = extras?.rotSpeedHz ?? p.rotationSpeedHz ?? 800;
  const expSpeedHz = extras?.expSpeedHz ?? p.expansionSpeedHz ?? 800;
  const dwellMs = p.timing?.dwell ?? p.t?.dwell ?? 100;
  const deflowerTimeS = extras?.deflowerTimeS ?? dwellMs / 1000;

  const angleLines: string[] = [];
  for (let i = 0; i < MACHINE_LAYER_LIMIT; i++) {
    const layer = model.layers[i];
    const active = i < model.layers.length && layer && layer.r > 0;
    const stepStr = (active ? layer.step : 0).toFixed(1).padStart(4, ' ');
    const offStr = (active ? layer.off : 0).toFixed(1).padStart(5, ' ');
    const idxStr = String(i + 1).padStart(2, ' ');
    angleLines.push(`${idxStr}  rotation angle  ${stepStr}  add ${offStr}`);
  }

  const expLen = p.layers <= 1 ? 0 : p.spacing;
  const procTimeSec = (tl.total / 1000).toFixed(2);

  const autoLines: string[] = [
    `rotation speed   : ${rotSpeedHz} Hz`,
    `expansion speed  : ${expSpeedHz} Hz`,
    `deflower layer   : ${p.layers} L`,
    `deflower time    : ${deflowerTimeS.toFixed(2)} S`,
    `expansion length : ${expLen} MM`,
    `processing time  : ${procTimeSec} S`,
  ];

  const full = [
    '===== TRAY DESIGNER RECIPE =====',
    `Generated: ${new Date().toISOString()}`,
    `Tray: ${p.trayD.toFixed(1)}mm | Tool: ${p.tool.toFixed(1)}mm | Margin: ${p.margin.toFixed(1)}mm | Layers: ${p.layers}`,
    `Total Holes: ${model.totalPts} | Steps/Head: ${model.totalSteps}`,
    '',
    '--- ANGLE PARAMETERS ---',
    ...angleLines,
    '',
    '--- AUTO PARAMETERS ---',
    ...autoLines,
    '================================',
  ].join('\n');

  return {
    angleLines,
    autoLines,
    full,
  };
}

export function generatePlcJson(p: TrayParams, model: TrayModel, totalCycleMs: number): string {
  const data = {
    protocol: 'TouchWin-PLC/HMI-v3',
    device: '3-HEAD-ROTARY-TRAY-DRILLER',
    generated_at: new Date().toISOString(),
    geometry: {
      tray_diameter_mm: Number(p.trayD.toFixed(3)),
      tray_radius_mm: Number(model.R.toFixed(3)),
      tool_diameter_mm: p.tool,
      outer_margin_mm: Number(p.margin.toFixed(3)),
      concentric_layers_count: model.layers.length,
      radial_spacing_mm: Number(p.spacing.toFixed(3)),
      min_clearance_mm: Number(model.minD.toFixed(3)),
    },
    heads: HEADS.map((h) => ({
      id: h.id,
      angle_deg: h.angle,
    })),
    timings_ms: {
      dwell_plunge: p.timing.dwell,
      index_rotate: p.timing.index,
      layer_reposition: p.timing.layer,
      total_cycle_estimated: Math.round(totalCycleMs),
    },
    totals: {
      total_holes: model.totalPts,
      steps_per_head: model.totalSteps,
      safe_validated: !model.hasErr,
    },
    layers: model.layers.map((L) => ({
      layer_number: L.i + 1,
      radius_mm: Number(L.r.toFixed(3)),
      holes_total: L.n,
      holes_per_head: L.per,
      step_angle_deg: Number(L.step.toFixed(4)),
      offset_deg: Number(L.off.toFixed(4)),
      points: L.pts.map((q) => ({
        index: q.k + 1,
        head_id: HEADS[q.head].id,
        head_step: q.j + 1,
        angle_deg: Number(q.a.toFixed(4)),
        x_mm: Number(q.x.toFixed(3)),
        y_mm: Number(q.y.toFixed(3)),
      })),
    })),
  };

  return JSON.stringify(data, null, 2);
}

export function generateCsvPoints(model: TrayModel): string {
  const headers = [
    'Layer',
    'Point_Index',
    'Head_ID',
    'Head_Step',
    'Angle_Deg',
    'X_mm',
    'Y_mm',
    'Radius_mm',
  ];

  const rows: string[] = [headers.join(',')];

  model.layers.forEach((L) => {
    L.pts.forEach((q) => {
      rows.push(
        [
          L.i + 1,
          q.k + 1,
          HEADS[q.head].id,
          q.j + 1,
          q.a.toFixed(4),
          q.x.toFixed(3),
          q.y.toFixed(3),
          L.r.toFixed(3),
        ].join(',')
      );
    });
  });

  return '\ufeff' + rows.join('\r\n');
}

export function generateCompactQrPayload(p: TrayParams, model: TrayModel, totalCycleMs: number): string {
  // A compact human & machine-readable payload suitable for QR codes (<500 chars)
  const hydrated = normalizeAndHydrateParams(p);
  const layerSummary = Array.from({ length: hydrated.layers }, (_, i) => {
    const modelLayer = model.layers[i];
    const r = modelLayer ? modelLayer.r : Math.max(0, (hydrated.trayD - 2 * hydrated.margin) / 2 - i * (hydrated.spacing / 2));
    const c =
      hydrated.mode === 'all'
        ? { n: hydrated.rawBase, off: i * hydrated.addAngle }
        : hydrated.custom[i] || { n: hydrated.rawBase, off: i * hydrated.addAngle };
    return `L${i + 1}:${r.toFixed(1)}mmx${c.n}pts@${c.off.toFixed(1)}°`;
  }).join('|');

  const compact = {
    M: 'TRAY3H',
    D: hydrated.trayD,
    T: hydrated.tool,
    Mgn: hydrated.margin,
    L: hydrated.layers,
    Spc: hydrated.spacing,
    Md: hydrated.mode,
    B: hydrated.rawBase,
    Add: hydrated.addAngle,
    Holes: model.totalPts,
    CycSec: Math.round(totalCycleMs / 1000),
    Safe: !model.hasErr ? 1 : 0,
    Lays: layerSummary,
  };

  return JSON.stringify(compact);
}

export function generateRecipeGCode(p: TrayParams, _model?: TrayModel): string {
  const hydrated = normalizeAndHydrateParams(p);
  const lines = [
    '; TRIVIUM-RECIPE-ANGLES-v1',
    '; NOT generic CNC toolpath (no G0/G1 moves)',
    '; Angles, speeds and layer recipe for TRIVIUM / TouchWin workflow',
    '; TRIVIUM recipe angles/speeds — not generic CNC toolpath',
    '; name: Exported Recipe',
    'FORMAT=TRIVIUM-GCODE-v1',
    `TRAY_D=${hydrated.trayD.toFixed(3)}`,
    `TOOL=${hydrated.tool.toFixed(3)}`,
    `MARGIN=${hydrated.margin.toFixed(3)}`,
    `LAYERS=${hydrated.layers}`,
    `SPACING=${hydrated.spacing.toFixed(3)}`,
    `MODE=${hydrated.mode}`,
    `RAW_BASE=${hydrated.rawBase}`,
    `ADD_ANGLE=${hydrated.addAngle.toFixed(4)}`,
    `ROT_HZ=${hydrated.rotationSpeedHz.toFixed(3)}`,
    `EXP_HZ=${hydrated.expansionSpeedHz.toFixed(3)}`,
    `PULSES_REV=${hydrated.pulsesPerRev}`,
    `PULSES_MM=${hydrated.pulsesPerMm}`,
    `DWELL_MS=${hydrated.timing.dwell}`,
    `INDEX_MS=${hydrated.timing.index}`,
    `LAYER_MS=${hydrated.timing.layer}`,
  ];

  for (let i = 0; i < hydrated.layers; i++) {
    const c =
      hydrated.mode === 'all'
        ? {
            n: hydrated.rawBase,
            off: i * hydrated.addAngle,
            stepAngle: 360 / hydrated.rawBase,
          }
        : hydrated.custom[i] || {
            n: hydrated.rawBase,
            off: i * hydrated.addAngle,
            stepAngle: 360 / hydrated.rawBase,
          };
    const stepAngle =
      typeof c.stepAngle === 'number' && Number.isFinite(c.stepAngle) && c.stepAngle > 0
        ? c.stepAngle
        : 360 / c.n;
    lines.push(
      `L${i + 1}_N=${c.n} L${i + 1}_STEP=${stepAngle.toFixed(4)} L${i + 1}_OFF=${c.off.toFixed(4)}`
    );
  }

  return lines.join('\n');
}

export function parseRecipeGCode(text: string): {
  params: TrayParams | null;
  errors?: RecipeErrorCode[];
  error?: string;
} {
  if (typeof text !== 'string' || !text.trim()) {
    return { params: null, errors: ['INVALID_FORMAT_VERSION'], error: 'Empty G-code file' };
  }

  const partial: Partial<TrayParams> = {
    timing: { dwell: 100, index: 120, layer: 400 },
  };
  const customMap = new Map<number, { n: number; off: number; stepAngle: number }>();
  let recognizedTokens = 0;

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith(';'));

  if (lines.length === 0) {
    return { params: null, errors: ['INVALID_FORMAT_VERSION'], error: 'Empty G-code file' };
  }

  try {
    for (const line of lines) {
      if (line.startsWith('FORMAT=')) {
        const fmtVal = line.split('=')[1]?.trim();
        if (fmtVal !== 'TRIVIUM-GCODE-v1' && fmtVal !== 'TRIVIUM-RECIPE-ANGLES-v1') {
          return {
            params: null,
            errors: ['INVALID_FORMAT_VERSION'],
            error: 'Unsupported G-code format',
          };
        }
        recognizedTokens++;
      } else if (line.startsWith('TRAY_D=')) {
        partial.trayD = parseFloat(line.split('=')[1]);
        recognizedTokens++;
      } else if (line.startsWith('TOOL=')) {
        partial.tool = parseFloat(line.split('=')[1]);
        recognizedTokens++;
      } else if (line.startsWith('MARGIN=')) {
        partial.margin = parseFloat(line.split('=')[1]);
        recognizedTokens++;
      } else if (line.startsWith('LAYERS=')) {
        partial.layers = parseInt(line.split('=')[1], 10);
        recognizedTokens++;
      } else if (line.startsWith('SPACING=')) {
        partial.spacing = parseFloat(line.split('=')[1]);
        recognizedTokens++;
      } else if (line.startsWith('MODE=')) {
        const m = line.split('=')[1]?.trim();
        if (m === 'all' || m === 'custom' || m === 'machine') {
          partial.mode = m;
        }
        recognizedTokens++;
      } else if (line.startsWith('RAW_BASE=')) {
        partial.rawBase = parseInt(line.split('=')[1], 10);
        recognizedTokens++;
      } else if (line.startsWith('ADD_ANGLE=')) {
        partial.addAngle = parseFloat(line.split('=')[1]);
        recognizedTokens++;
      } else if (line.startsWith('ROT_HZ=')) {
        partial.rotationSpeedHz = parseFloat(line.split('=')[1]);
        recognizedTokens++;
      } else if (line.startsWith('EXP_HZ=')) {
        partial.expansionSpeedHz = parseFloat(line.split('=')[1]);
        recognizedTokens++;
      } else if (line.startsWith('PULSES_REV=')) {
        partial.pulsesPerRev = parseInt(line.split('=')[1], 10);
        recognizedTokens++;
      } else if (line.startsWith('PULSES_MM=')) {
        partial.pulsesPerMm = parseInt(line.split('=')[1], 10);
        recognizedTokens++;
      } else if (line.startsWith('DWELL_MS=')) {
        partial.timing!.dwell = parseInt(line.split('=')[1], 10);
        recognizedTokens++;
      } else if (line.startsWith('INDEX_MS=')) {
        partial.timing!.index = parseInt(line.split('=')[1], 10);
        recognizedTokens++;
      } else if (line.startsWith('LAYER_MS=')) {
        partial.timing!.layer = parseInt(line.split('=')[1], 10);
        recognizedTokens++;
      } else if (/^L\d+_/.test(line)) {
        const parts = line.split(/\s+/);
        let layerIdx = -1;
        let nVal: number | undefined;
        let stepVal: number | undefined;
        let offVal = 0;

        for (const token of parts) {
          const [key, val] = token.split('=');
          if (!key || val === undefined) continue;
          const m = key.match(/^L(\d+)_(N|STEP|OFF)$/);
          if (!m) continue;
          layerIdx = parseInt(m[1], 10) - 1;
          const prop = m[2];
          if (prop === 'N') nVal = parseInt(val, 10);
          else if (prop === 'STEP') stepVal = parseFloat(val);
          else if (prop === 'OFF') offVal = parseFloat(val);
        }

        if (layerIdx >= 0 && layerIdx < 7) {
          let resolvedN = nVal;
          if (
            (resolvedN === undefined || !Number.isFinite(resolvedN) || resolvedN <= 0) &&
            stepVal !== undefined &&
            Number.isFinite(stepVal) &&
            stepVal > 0
          ) {
            resolvedN = Math.round(360 / stepVal);
          }
          if (resolvedN !== undefined && Number.isFinite(resolvedN) && resolvedN > 0) {
            const safeOff = Number.isFinite(offVal) ? offVal : 0;
            const syncedStep = 360 / resolvedN;
            customMap.set(layerIdx, {
              n: resolvedN,
              off: safeOff,
              stepAngle: Number(syncedStep.toFixed(4)),
            });
            recognizedTokens++;
          } else {
            return {
              params: null,
              errors: ['CUSTOM_LAYER_INVALID'],
              error: `Invalid layer L${layerIdx + 1} definition`,
            };
          }
        }
      }
    }

    if (recognizedTokens === 0 || partial.trayD === undefined) {
      return {
        params: null,
        errors: ['INVALID_FORMAT_VERSION'],
        error: 'Missing required TRIVIUM G-code fields',
      };
    }

    if (customMap.size > 0) {
      const maxIdx = Math.max(...Array.from(customMap.keys()));
      const customArr: Array<{ n: number; off: number; stepAngle?: number }> = [];
      for (let i = 0; i <= maxIdx; i++) {
        const entry = customMap.get(i);
        if (entry) {
          customArr.push(entry);
        } else {
          const fallbackN = partial.rawBase || 6;
          customArr.push({
            n: fallbackN,
            off: i * (partial.addAngle || 0),
            stepAngle: Number((360 / fallbackN).toFixed(4)),
          });
        }
      }
      partial.custom = customArr;
    }

    // Validate explicit raw numbers before hydration so invalid ranges aren't clamped silently
    const preValidation = validateRecipeParams({
      trayD: partial.trayD,
      tool: partial.tool ?? 20,
      margin: partial.margin ?? 90,
      layers: partial.layers ?? 4,
      spacing: partial.spacing ?? 76.3,
      custom: partial.custom,
    });

    if (!preValidation.ok) {
      return {
        params: null,
        errors: preValidation.errors,
        error: preValidation.messages.join('; '),
      };
    }

    const hydrated = normalizeAndHydrateParams(partial);
    return { params: hydrated };
  } catch {
    return { params: null, errors: ['INVALID_JSON'], error: 'Failed to parse G-code' };
  }
}

export function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Parses a JSON recipe string with detailed error codes.
 * 1) Tries canonical TRIVIUM-RECIPE-v1 via parseRecipeV1
 * 2) Tries legacy formats (RecipePreset, PLC JSON geometry, Compact QR, raw TrayParams)
 * 3) Hydrates & validates all legacy outputs through normalizeAndHydrateParams + validateRecipeParams
 */
export function parseJsonRecipeWithErrors(jsonStr: string): {
  ok: boolean;
  params: TrayParams | null;
  errors: RecipeErrorCode[];
} {
  let raw: any;
  try {
    raw = JSON.parse(jsonStr);
  } catch {
    return { ok: false, params: null, errors: ['INVALID_JSON'] };
  }

  if (!raw || typeof raw !== 'object') {
    return { ok: false, params: null, errors: ['INVALID_JSON'] };
  }

  // 1. Canonical TRIVIUM-RECIPE-v1 format
  if (raw.format === 'TRIVIUM-RECIPE-v1' || raw.version !== undefined) {
    const v1 = parseRecipeV1(raw);
    if (v1.ok && v1.params) {
      return { ok: true, params: v1.params, errors: [] };
    }
    return { ok: false, params: null, errors: v1.errors };
  }

  let legacyCandidate: Partial<TrayParams> | null = null;

  // 2a. RecipePreset object: { params: { trayD: ... } }
  if (raw.params && typeof raw.params === 'object' && typeof raw.params.trayD === 'number') {
    legacyCandidate = raw.params as Partial<TrayParams>;
  }
  // 2b. Exported TouchWin PLC JSON object: { geometry: { tray_diameter_mm: ... } }
  else if (raw.geometry && typeof raw.geometry.tray_diameter_mm === 'number') {
    const g = raw.geometry;
    const res: Partial<TrayParams> = {
      trayD: g.tray_diameter_mm,
      tool: g.tool_diameter_mm ?? 3.5,
      margin: g.outer_margin_mm ?? 25,
      layers: g.concentric_layers_count ?? 4,
      spacing: g.radial_spacing_mm ?? 19.5,
    };
    if (raw.timings_ms && typeof raw.timings_ms === 'object') {
      res.timing = {
        dwell: raw.timings_ms.dwell_plunge ?? 100,
        index: raw.timings_ms.index_rotate ?? 120,
        layer: raw.timings_ms.layer_reposition ?? 400,
      };
    }
    if (Array.isArray(raw.layers) && raw.layers.length > 0) {
      res.custom = raw.layers.map((l: any) => ({
        n: l.holes_total || 12,
        off: l.offset_deg || 0,
        stepAngle: l.step_angle_deg,
      }));
      res.mode = 'custom';
    }
    legacyCandidate = res;
  }
  // 2c. Compact QR format { M: 'TRAY3H', D: 350, ... }
  else if (raw.M === 'TRAY3H' || typeof raw.D === 'number') {
    const res: Partial<TrayParams> = {};
    if (typeof raw.D === 'number') res.trayD = raw.D;
    if (typeof raw.T === 'number') res.tool = raw.T;
    if (typeof raw.Mgn === 'number') res.margin = raw.Mgn;
    if (typeof raw.L === 'number') res.layers = raw.L;
    if (typeof raw.Spc === 'number') res.spacing = raw.Spc;
    if (raw.Md === 'all' || raw.Md === 'custom' || raw.Md === 'machine') res.mode = raw.Md;
    if (typeof raw.B === 'number') res.rawBase = raw.B;
    if (typeof raw.Add === 'number') res.addAngle = raw.Add;

    if (typeof raw.Lays === 'string') {
      const layerParts = raw.Lays.split('|');
      const radii: number[] = [];
      const custom = layerParts.map((part: string) => {
        const rMatch = part.match(/:([\d.]+)mmx/);
        const ptsMatch = part.match(/x(\d+)pts/);
        const offMatch = part.match(/@([-\d.]+)°/);
        if (rMatch) radii.push(parseFloat(rMatch[1]));
        const n = ptsMatch ? parseInt(ptsMatch[1], 10) : 12;
        const off = offMatch ? parseFloat(offMatch[1]) : 0;
        return { n, off, stepAngle: Number((360 / n).toFixed(4)) };
      });
      if (custom.length > 0) {
        res.custom = custom;
        if (!res.mode) res.mode = 'custom';
      }
      if (res.spacing === undefined && radii.length > 1) {
        res.spacing = Number((Math.abs(radii[0] - radii[1]) * 2).toFixed(3));
      }
    }
    legacyCandidate = res;
  }
  // 2d. Raw TrayParams object
  else if (typeof raw.trayD === 'number') {
    legacyCandidate = raw as Partial<TrayParams>;
  }

  if (!legacyCandidate) {
    return { ok: false, params: null, errors: ['INVALID_FORMAT_VERSION'] };
  }

  // Validate explicit raw numbers before hydration so invalid layers/ranges aren't clamped silently
  const preCheck = validateRecipeParams({
    trayD: legacyCandidate.trayD,
    tool: legacyCandidate.tool ?? 20,
    margin: legacyCandidate.margin ?? 90,
    layers: legacyCandidate.layers ?? 4,
    spacing: legacyCandidate.spacing ?? 76.3,
    custom: legacyCandidate.custom,
  });
  if (!preCheck.ok) {
    return { ok: false, params: null, errors: preCheck.errors };
  }

  // 3. Hydrate with DEFAULT_PARAMS and compute rLast
  const hydrated = normalizeAndHydrateParams(legacyCandidate);
  return { ok: true, params: hydrated, errors: [] };
}

export function parseJsonRecipeToParams(jsonStr: string): TrayParams | null {
  const result = parseJsonRecipeWithErrors(jsonStr);
  return result.ok ? result.params : null;
}

export function parseCsvPointsToParams(csvContent: string): TrayParams | null {
  try {
    const lines = csvContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length < 2) return null;

    // Filter out header line
    const dataLines = lines.filter((l) => !l.startsWith('Layer') && !l.startsWith('#'));
    if (dataLines.length === 0) return null;

    // Map rows: Layer, Point_Index, Head_ID, Head_Step, Angle_Deg, X_mm, Y_mm, Radius_mm
    const layerRadiiMap = new Map<number, number>();
    const layerHolesMap = new Map<number, number>();

    dataLines.forEach((line) => {
      const parts = line.split(',');
      if (parts.length >= 8) {
        const layerNum = parseInt(parts[0], 10);
        const radius = parseFloat(parts[7]);
        if (!isNaN(layerNum) && !isNaN(radius)) {
          if (!layerRadiiMap.has(layerNum)) {
            layerRadiiMap.set(layerNum, radius);
            layerHolesMap.set(layerNum, 0);
          }
          layerHolesMap.set(layerNum, (layerHolesMap.get(layerNum) || 0) + 1);
        }
      }
    });

    const layerNums = Array.from(layerRadiiMap.keys()).sort((a, b) => a - b);
    if (layerNums.length === 0) return null;

    const r1 = layerRadiiMap.get(layerNums[0]) || 162.5;
    const r2 = layerNums.length > 1 ? layerRadiiMap.get(layerNums[1]) || r1 - 9.75 : r1 - 10;
    const spacing = Math.max(1, Number((Math.abs(r1 - r2) * 2).toFixed(1)));
    const margin = 25;
    const trayD = Number((r1 * 2 + margin).toFixed(1));

    const custom = layerNums.map((num) => {
      const n = layerHolesMap.get(num) || 12;
      return {
        n,
        off: 0,
        stepAngle: 360 / n,
      };
    });

    const hydrated = normalizeAndHydrateParams({
      trayD,
      margin,
      layers: Math.min(7, Math.max(1, layerNums.length)),
      spacing,
      custom,
      mode: 'custom',
    });

    const validation = validateRecipeParams(hydrated);
    return validation.ok ? hydrated : null;
  } catch (e) {
    console.warn('Failed to parse CSV points:', e);
  }
  return null;
}
