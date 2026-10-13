/**
 * Tests for recipe generation — output sent to the TouchWin PLC.
 *
 * The format must match the machine screen exactly, because an
 * operator reads these numbers and types them into the controller.
 * A single wrong digit means a wasted tray.
 */
import { describe, it, expect } from 'vitest';
import { buildModel } from '../model';
import { buildTimeline } from '../timeline';
import {
  buildRecipeText,
  serializeRecipeV1,
  parseRecipeV1,
  validateRecipeParams,
  parseJsonRecipeToParams,
  generatePlcJson,
  generateCompactQrPayload,
  generateRecipeGCode,
  parseRecipeGCode,
  formatRecipeErrorsList,
} from '../recipe';
import { DEFAULT_PARAMS } from '../constants';
import type { ModelParams } from '../model';

function makeParams(overrides: Partial<ModelParams> = {}): ModelParams {
  return {
    trayD: 300, tool: 3.5, margin: 25,
    layers: 3, spacing: 20,
    mode: 'all', rawBase: 12, addAngle: 0,
    custom: Array.from({ length: 8 }, () => ({ n: 12, off: 0 })),
    t: { dwell: 120, index: 150, layer: 1000 },
    ...overrides,
  };
}

const machineExtras = {
  rotSpeedHz: 800,
  expSpeedHz: 800,
  deflowerTimeS: 0.10,
};

// ─────────────────────────────────────────────────────────
// Angle lines
// ─────────────────────────────────────────────────────────
describe('buildRecipeText — angle lines', () => {
  it('emits exactly MACHINE_LAYER_LIMIT lines', () => {
    const m = buildModel(makeParams());
    const tl = buildTimeline(m, makeParams().t);
    const r = buildRecipeText(m, makeParams(), tl, machineExtras);
    expect(r.angleLines).toHaveLength(7);
  });

  it('active layers carry real step angle, in `rotation angle` column', () => {
    const p = makeParams({ layers: 3, rawBase: 12 });
    const m = buildModel(p);
    const tl = buildTimeline(m, p.t);
    const r = buildRecipeText(m, p, tl, machineExtras);

    // Layer 1: 12 points → 30.0°
    expect(r.angleLines[0]).toMatch(/rotation angle\s+30\.0/);
    expect(r.angleLines[1]).toMatch(/rotation angle\s+30\.0/);
    expect(r.angleLines[2]).toMatch(/rotation angle\s+30\.0/);
  });

  it('inactive layers show 0.0 rotation angle', () => {
    const p = makeParams({ layers: 2 });
    const m = buildModel(p);
    const tl = buildTimeline(m, p.t);
    const r = buildRecipeText(m, p, tl, machineExtras);

    for (let i = 2; i < 7; i++) {
      expect(r.angleLines[i]).toMatch(/rotation angle\s+0\.0/);
    }
  });

  it('reflects per-layer custom offsets in the `add` column', () => {
    const custom = [
      { n: 12, off: 0 },
      { n: 12, off: 7.5 },
      { n: 12, off: 15.0 },
    ];
    const p = makeParams({ mode: 'custom', custom, layers: 3 });
    const m = buildModel(p);
    const tl = buildTimeline(m, p.t);
    const r = buildRecipeText(m, p, tl, machineExtras);

    expect(r.angleLines[0]).toMatch(/add\s+0\.0/);
    expect(r.angleLines[1]).toMatch(/add\s+7\.5/);
    expect(r.angleLines[2]).toMatch(/add\s+15\.0/);
  });

  it('numeric values are padded for alignment', () => {
    const p = makeParams({ layers: 4, rawBase: 6 });   // step = 60°
    const m = buildModel(p);
    const tl = buildTimeline(m, p.t);
    const r = buildRecipeText(m, p, tl, machineExtras);
    // All rotation-angle fields (including leading pad) should have the same 4-char width
    const steps = r.angleLines.map(l => l.match(/rotation angle {2}(.{4})/)![1]);
    const widths = new Set(steps.map(s => s.length));
    expect(widths.size).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────
// Auto parameters
// ─────────────────────────────────────────────────────────
describe('buildRecipeText — auto parameters', () => {
  it('contains all six expected keys', () => {
    const p = makeParams();
    const m = buildModel(p);
    const tl = buildTimeline(m, p.t);
    const r = buildRecipeText(m, p, tl, machineExtras);
    const text = r.autoLines.join('\n');
    expect(text).toMatch(/rotation speed/);
    expect(text).toMatch(/expansion speed/);
    expect(text).toMatch(/deflower layer/);
    expect(text).toMatch(/deflower time/);
    expect(text).toMatch(/expansion length/);
    expect(text).toMatch(/processing time/);
  });

  it('rotation speed uses the provided Hz value', () => {
    const p = makeParams();
    const m = buildModel(p);
    const tl = buildTimeline(m, p.t);
    const r = buildRecipeText(m, p, tl, {
      ...machineExtras, rotSpeedHz: 1234,
    });
    expect(r.autoLines.join('\n')).toMatch(/rotation speed\s*:\s*1234\s*Hz/);
  });

  it('expansion speed uses the provided Hz value', () => {
    const p = makeParams();
    const m = buildModel(p);
    const tl = buildTimeline(m, p.t);
    const r = buildRecipeText(m, p, tl, {
      ...machineExtras, expSpeedHz: 950,
    });
    expect(r.autoLines.join('\n')).toMatch(/expansion speed\s*:\s*950\s*Hz/);
  });

  it('deflower layer equals the number of layers', () => {
    for (const n of [1, 3, 5, 7]) {
      const p = makeParams({ layers: n });
      const m = buildModel(p);
      const tl = buildTimeline(m, p.t);
      const r = buildRecipeText(m, p, tl, machineExtras);
      expect(r.autoLines.join('\n')).toMatch(new RegExp(`deflower layer\\s*:\\s*${n}\\s*L`));
    }
  });

  it('deflower time is rendered in seconds', () => {
    const p = makeParams();
    const m = buildModel(p);
    const tl = buildTimeline(m, p.t);
    const r = buildRecipeText(m, p, tl, {
      ...machineExtras, deflowerTimeS: 0.25,
    });
    expect(r.autoLines.join('\n')).toMatch(/deflower time\s*:\s*0\.25\s*S/);
  });

  it('expansion length is 0 when only one layer', () => {
    const p = makeParams({ layers: 1 });
    const m = buildModel(p);
    const tl = buildTimeline(m, p.t);
    const r = buildRecipeText(m, p, tl, machineExtras);
    expect(r.autoLines.join('\n')).toMatch(/expansion length\s*:\s*0\s*MM/);
  });

  it('processing time matches the timeline total (rounded to 2 decimals)', () => {
    const p = makeParams({ layers: 3, rawBase: 12 });
    const m = buildModel(p);
    const tl = buildTimeline(m, p.t);
    const r = buildRecipeText(m, p, tl, machineExtras);
    const expected = (tl.total / 1000).toFixed(2);
    expect(r.autoLines.join('\n')).toContain(expected);
  });
});

// ─────────────────────────────────────────────────────────
// Full text output
// ─────────────────────────────────────────────────────────
describe('buildRecipeText — full text', () => {
  it('starts with a machine-parsable header', () => {
    const p = makeParams();
    const m = buildModel(p);
    const tl = buildTimeline(m, p.t);
    const r = buildRecipeText(m, p, tl, machineExtras);
    expect(r.full).toContain('===== TRAY DESIGNER RECIPE =====');
  });

  it('includes ANGLE PARAMETERS section', () => {
    const p = makeParams();
    const m = buildModel(p);
    const tl = buildTimeline(m, p.t);
    const r = buildRecipeText(m, p, tl, machineExtras);
    expect(r.full).toContain('--- ANGLE PARAMETERS ---');
  });

  it('includes AUTO PARAMETERS section', () => {
    const p = makeParams();
    const m = buildModel(p);
    const tl = buildTimeline(m, p.t);
    const r = buildRecipeText(m, p, tl, machineExtras);
    expect(r.full).toContain('--- AUTO PARAMETERS ---');
  });

  it('includes tray, tool, and layer summary', () => {
    const p = makeParams({ trayD: 400, tool: 4.2, layers: 5 });
    const m = buildModel(p);
    const tl = buildTimeline(m, p.t);
    const r = buildRecipeText(m, p, tl, machineExtras);
    expect(r.full).toMatch(/Tray:\s*400\.0mm/);
    expect(r.full).toMatch(/Tool:\s*4\.2mm/);
    expect(r.full).toMatch(/Layers:\s*5/);
  });

  it('is pure text (no HTML, no control chars)', () => {
    const p = makeParams();
    const m = buildModel(p);
    const tl = buildTimeline(m, p.t);
    const r = buildRecipeText(m, p, tl, machineExtras);
    expect(r.full).not.toMatch(/<[^>]+>/);
    // eslint-disable-next-line no-control-regex
    expect(r.full).not.toMatch(/[\x00-\x08\x0B-\x1F]/);
  });

  it('is deterministic apart from the timestamp', () => {
    const p = makeParams();
    const m = buildModel(p);
    const tl = buildTimeline(m, p.t);
    const r1 = buildRecipeText(m, p, tl, machineExtras);
    const r2 = buildRecipeText(m, p, tl, machineExtras);
    const strip = (s: string) => s.replace(/Generated:.*\n/, '');
    expect(strip(r1.full)).toBe(strip(r2.full));
  });
});

// ─────────────────────────────────────────────────────────
// Regression snapshots
// ─────────────────────────────────────────────────────────
describe('buildRecipeText — regression', () => {
  it('matches the golden output for the default config', () => {
    const p = makeParams({ layers: 4, rawBase: 12 });
    const m = buildModel(p);
    const tl = buildTimeline(m, p.t);
    const r = buildRecipeText(m, p, tl, machineExtras);
    const stripped = r.angleLines.join('\n');
    expect(stripped).toMatchInlineSnapshot(`
      " 1  rotation angle  30.0  add   0.0
       2  rotation angle  30.0  add   0.0
       3  rotation angle  30.0  add   0.0
       4  rotation angle  30.0  add   0.0
       5  rotation angle   0.0  add   0.0
       6  rotation angle   0.0  add   0.0
       7  rotation angle   0.0  add   0.0"
    `);
  });
});

// ─────────────────────────────────────────────────────────
// TRIVIUM-RECIPE-v1 Serialization, Validation & Roundtrip
// ─────────────────────────────────────────────────────────
describe('TRIVIUM-RECIPE-v1 — serialize, validate, parse & legacy compatibility', () => {
  it('serializes and parses V1 recipe with exact geometric rLast and 7+ custom layers', () => {
    const json = serializeRecipeV1(DEFAULT_PARAMS, {
      name: 'Spiral 390',
      description: 'Test recipe',
    });
    const parsed = parseRecipeV1(json);

    expect(parsed.ok).toBe(true);
    expect(parsed.errors).toHaveLength(0);
    expect(parsed.meta?.name).toBe('Spiral 390');
    expect(parsed.params).toBeDefined();

    const p = parsed.params!;
    expect(p.trayD).toBe(390);
    expect(p.trayU).toBe('mm');
    expect(p.marginU).toBe('mm');
    expect(p.spacingU).toBe('mm');
    expect(p.rLastU).toBe('mm');

    // d1 = 390 - 90 = 300; rLast = max(0, 300 - 76.3 * 3) = 71.1 (never hardcoded 100!)
    expect(p.rLast).toBeCloseTo(71.1, 3);
    expect(p.rLastDisplay).toBeCloseTo(71.1, 3);
    expect(p.custom.length).toBeGreaterThanOrEqual(7);
    expect(p.custom[0].stepAngle).toBeCloseTo(60, 4);
    expect(p.pulsesPerRev).toBe(10000);
    expect(p.pulsesPerMm).toBe(100);
  });

  it('rejects out-of-range parameters with structured error codes and AR/FR messages', () => {
    const res = validateRecipeParams({
      trayD: 10,
      tool: 0,
      margin: -5,
      layers: 9,
      spacing: 0,
      custom: [{ n: -3, off: 0, stepAngle: -10 }],
    });

    expect(res.ok).toBe(false);
    expect(res.errors).toContain('TRAY_D_RANGE');
    expect(res.errors).toContain('TOOL_RANGE');
    expect(res.errors).toContain('MARGIN_RANGE');
    expect(res.errors).toContain('LAYERS_RANGE');
    expect(res.errors).toContain('SPACING_RANGE');
    expect(res.errors).toContain('CUSTOM_LAYER_INVALID');

    expect(formatRecipeErrorsList(['TRAY_D_RANGE'], 'ar')).toContain('50');
    expect(formatRecipeErrorsList(['TRAY_D_RANGE'], 'fr')).toContain('50');
  });

  it('hydrates legacy PLC JSON and Compact QR payloads with DEFAULT_PARAMS and accurate rLast', () => {
    const m = buildModel(DEFAULT_PARAMS);
    const plcStr = generatePlcJson(DEFAULT_PARAMS, m, 7580);
    const fromPlc = parseJsonRecipeToParams(plcStr);
    expect(fromPlc).not.toBeNull();
    expect(fromPlc!.rLast).toBeCloseTo(71.1, 2);
    expect(fromPlc!.custom.length).toBeGreaterThanOrEqual(7);

    const qrStr = generateCompactQrPayload(DEFAULT_PARAMS, m, 7580);
    const fromQr = parseJsonRecipeToParams(qrStr);
    expect(fromQr).not.toBeNull();
    expect(fromQr!.trayD).toBe(390);
    expect(fromQr!.layers).toBe(4);
    expect(fromQr!.spacing).toBeCloseTo(76.3, 3);
    expect(fromQr!.rLast).toBeCloseTo(71.1, 3);
    expect(fromQr!.custom.slice(0, 4)).toEqual(DEFAULT_PARAMS.custom.slice(0, 4));
  });

  it('roundtrips G-code (TRIVIUM-GCODE-v1) with header comment, stepAngle sync, and error handling without throwing', () => {
    const gcode = generateRecipeGCode(DEFAULT_PARAMS);
    expect(gcode).toContain('FORMAT=TRIVIUM-GCODE-v1');
    expect(gcode).toContain('; TRIVIUM recipe angles/speeds — not generic CNC toolpath');
    expect(gcode).toContain('L1_N=6 L1_STEP=60.0000 L1_OFF=-4.5000');
    expect(gcode).toContain('L4_N=6 L4_STEP=60.0000 L4_OFF=38.5000');

    const parsed = parseRecipeGCode(gcode);
    expect(parsed.error).toBeUndefined();
    expect(parsed.params).not.toBeNull();
    expect(parsed.params!.trayD).toBe(390);
    expect(parsed.params!.layers).toBe(4);
    expect(parsed.params!.spacing).toBeCloseTo(76.3, 3);
    expect(parsed.params!.rLast).toBeCloseTo(71.1, 3);
    expect(parsed.params!.custom.slice(0, 4)).toEqual(DEFAULT_PARAMS.custom.slice(0, 4));

    const badGcode = parseRecipeGCode('G0 X10 Y20\nG1 Z-5 F200');
    expect(badGcode.params).toBeNull();
    expect(badGcode.error).toBeDefined();
  });

  it('parseRecipeV1 rejects trayD out of range (< 50 or > 2000)', () => {
    const tooSmall = parseRecipeV1({
      format: 'TRIVIUM-RECIPE-v1',
      version: 1,
      meta: { createdAt: '2026-01-01T00:00:00.000Z' },
      params: { ...DEFAULT_PARAMS, trayD: 30 },
    });
    expect(tooSmall.ok).toBe(false);
    expect(tooSmall.errors).toContain('TRAY_D_RANGE');

    const tooLarge = parseRecipeV1({
      format: 'TRIVIUM-RECIPE-v1',
      version: 1,
      meta: { createdAt: '2026-01-01T00:00:00.000Z' },
      params: { ...DEFAULT_PARAMS, trayD: 2500 },
    });
    expect(tooLarge.ok).toBe(false);
    expect(tooLarge.errors).toContain('TRAY_D_RANGE');
  });

  it('parseRecipeV1 merges defaults and computes rLast accurately from trayD/margin/spacing/layers', () => {
    const res = parseRecipeV1({
      format: 'TRIVIUM-RECIPE-v1',
      version: 1,
      meta: { createdAt: '2026-01-01T00:00:00.000Z' },
      params: {
        trayD: 400,
        tool: 5,
        margin: 40,
        layers: 4,
        spacing: 50,
        mode: 'all',
        rawBase: 12,
        addAngle: 5,
      },
    });
    expect(res.ok).toBe(true);
    // d1 = 400 - 80 = 320; rLast = 320 - 50 * (4 - 1) = 170
    expect(res.params!.rLast).toBeCloseTo(170, 3);
    expect(res.params!.timing.dwell).toBe(DEFAULT_PARAMS.timing.dwell);
    expect(res.params!.custom.length).toBeGreaterThanOrEqual(7);
  });

  it('round-trip serializeRecipeV1 -> parseRecipeV1 preserves trayD, layers, spacing, mode', () => {
    const customConfig = {
      ...DEFAULT_PARAMS,
      trayD: 480,
      layers: 5,
      spacing: 42.5,
      mode: 'all' as const,
    };
    const serialized = serializeRecipeV1(customConfig);
    const parsed = parseRecipeV1(serialized);
    expect(parsed.ok).toBe(true);
    expect(parsed.params!.trayD).toBe(480);
    expect(parsed.params!.layers).toBe(5);
    expect(parsed.params!.spacing).toBeCloseTo(42.5, 3);
    expect(parsed.params!.mode).toBe('all');
  });

  it('parseRecipeGCode reads TRAY_D and L1_N accurately', () => {
    const gcodeSample = [
      '; TRIVIUM-GCODE-v1',
      'FORMAT=TRIVIUM-GCODE-v1',
      'TRAY_D=520.000',
      'TOOL=12.000',
      'MARGIN=60.000',
      'LAYERS=3',
      'SPACING=80.000',
      'MODE=custom',
      'L1_N=18 L1_STEP=20.0000 L1_OFF=5.0000',
      'L2_N=12 L2_STEP=30.0000 L2_OFF=10.0000',
      'L3_N=6 L3_STEP=60.0000 L3_OFF=0.0000',
    ].join('\n');

    const res = parseRecipeGCode(gcodeSample);
    expect(res.error).toBeUndefined();
    expect(res.params).not.toBeNull();
    expect(res.params!.trayD).toBe(520);
    expect(res.params!.custom[0].n).toBe(18);
    expect(res.params!.custom[0].stepAngle).toBeCloseTo(20, 4);
  });
});



