import { describe, it, expect } from 'vitest';
import { applyTrayParamUpdates } from '../../hooks/useTrayParams';
import { DEFAULT_PARAMS } from '../constants';
import { validateRecipeParams, normalizeAndHydrateParams } from '../recipeFormat';
import { buildModel } from '../model';
import type { TrayParams } from '../../types';

describe('useTrayParams — P0 stepAngle & continue mode regression tests', () => {
  it('does NOT zero custom[0].stepAngle in continue + custom mode', () => {
    const prev: TrayParams = normalizeAndHydrateParams(DEFAULT_PARAMS);

    const updated = applyTrayParamUpdates(prev, {
      mode: 'custom',
      tableMode: 'continue',
      custom: [
        { n: 12, off: 0, stepAngle: 30 },
        { n: 12, off: 10, stepAngle: 30 },
      ],
    });

    // 1. stepAngle on layer 0 must remain valid (> 0) and NEVER 0
    expect(updated.custom[0].stepAngle).toBe(30);
    expect(updated.custom[0].stepAngle).toBeGreaterThan(0);
    expect(updated.custom[0].off).toBe(0);

    // 2. validateRecipeParams must succeed with ok: true
    const valResult = validateRecipeParams(updated);
    expect(valResult.ok).toBe(true);
    expect(valResult.errors).not.toContain('CUSTOM_LAYER_INVALID');

    // 3. Serialization -> Deserialization simulation (localStorage reload)
    const jsonStr = JSON.stringify(updated);
    const parsed = JSON.parse(jsonStr);
    const reloadValidation = validateRecipeParams(parsed);

    // Must validate successfully without being rejected back to DEFAULT_PARAMS
    expect(reloadValidation.ok).toBe(true);
    const rehydrated = normalizeAndHydrateParams(parsed);
    expect(rehydrated.custom[0].stepAngle).toBe(30);
    expect(rehydrated.custom[0].n).toBe(12);
    expect(rehydrated.tableMode).toBe('continue');
    expect(rehydrated.mode).toBe('custom');
  });

  it('enforces layer 0 off = 0 as angular origin reference in continue mode without touching stepAngle or n', () => {
    const prev: TrayParams = normalizeAndHydrateParams(DEFAULT_PARAMS);

    // User attempts to supply off != 0 on layer 0 in continue mode
    const updated = applyTrayParamUpdates(prev, {
      mode: 'custom',
      tableMode: 'continue',
      custom: [
        { n: 18, off: 15.5, stepAngle: 20 },
        { n: 12, off: 5.0, stepAngle: 30 },
      ],
    });

    // Layer 0 off is normalized to 0 (reference origin for continue chaining)
    expect(updated.custom[0].off).toBe(0);
    // stepAngle and n are preserved
    expect(updated.custom[0].stepAngle).toBe(20);
    expect(updated.custom[0].n).toBe(18);

    const val = validateRecipeParams(updated);
    expect(val.ok).toBe(true);
  });

  it('second case: off on subsequent layers does not break continue chaining in buildModel', () => {
    const params: TrayParams = normalizeAndHydrateParams({
      ...DEFAULT_PARAMS,
      mode: 'custom',
      tableMode: 'continue',
      layers: 3,
      custom: [
        { n: 12, off: 0, stepAngle: 30 },
        { n: 12, off: 45, stepAngle: 30 }, // arbitrary off in custom array
        { n: 12, off: 90, stepAngle: 30 },
      ],
    });

    const model = buildModel(params);

    // Layer 0 reference offset is 0
    expect(model.layers[0].off).toBe(0);

    // Layer 1 off in continue mode must follow the physical DCA04 kinematics chaining:
    // (prevPer - 1) * prevStep = (12/3 - 1) * (360/12) = 3 * 30 = 90 deg
    // It must NOT be reset or dictated by custom[1].off (45 deg)
    expect(model.layers[1].off).toBe(90);

    // Layer 2 off in continue mode:
    // 90 + (12/3 - 1) * 30 = 90 + 90 = 180 deg
    expect(model.layers[2].off).toBe(180);
  });
});
