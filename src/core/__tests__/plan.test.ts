import { describe, it, expect } from 'vitest';
import {
  deriveTableAngle,
  buildExecutionPlan,
  buildPreviewPlan,
  PlanHole,
} from '../plan';

describe('Execution Plan Engine (CAM Outer -> Inner)', () => {
  it('correctly derives machine table angle from tray angle and head index', () => {
    // When table is at 30°, heads at (0°, 120°, 240°) drill at tray angles:
    // head 0: 0 - 30 = -30 = 330°
    // head 1: 120 - 30 = 90°
    // head 2: 240 - 30 = 210°
    expect(deriveTableAngle(330, 0)).toBe(30);
    expect(deriveTableAngle(90, 1)).toBe(30);
    expect(deriveTableAngle(210, 2)).toBe(30);

    // When table is at 0°:
    expect(deriveTableAngle(0, 0)).toBe(0);
    expect(deriveTableAngle(120, 1)).toBe(0);
    expect(deriveTableAngle(240, 2)).toBe(0);
  });

  it('handles empty holes array gracefully', () => {
    const plan = buildExecutionPlan([], {
      stepRadialMm: 15,
      stepAngleDeg: 30,
    });

    expect(plan.totalHoles).toBe(0);
    expect(plan.totalPlunges).toBe(0);
    expect(plan.bands).toHaveLength(0);
    expect(plan.steps).toHaveLength(0);
    expect(plan.totalRadialTravelMm).toBe(0);
  });

  it('strictly sorts radial bands descending (Outer -> Inner) eliminating Yo-Yo', () => {
    // Simulate chaotic drilling: L1 (200mm) -> L3 (100mm) -> L2 (150mm) -> L1 again
    const holes: PlanHole[] = [
      // 1. Drilled at 200mm
      { id: '1', layer: 0, r: 200, a: 330, head: 0, drilledAt: 100 },
      { id: '2', layer: 0, r: 200, a: 90, head: 1, drilledAt: 100 },
      { id: '3', layer: 0, r: 200, a: 210, head: 2, drilledAt: 100 },
      // 2. Drilled at 100mm (jumped inward)
      { id: '4', layer: 2, r: 100, a: 330, head: 0, drilledAt: 200 },
      { id: '5', layer: 2, r: 100, a: 90, head: 1, drilledAt: 200 },
      { id: '6', layer: 2, r: 100, a: 210, head: 2, drilledAt: 200 },
      // 3. Drilled at 150mm (Yo-Yo outward!)
      { id: '7', layer: 1, r: 150, a: 330, head: 0, drilledAt: 300 },
      { id: '8', layer: 1, r: 150, a: 90, head: 1, drilledAt: 300 },
      { id: '9', layer: 1, r: 150, a: 210, head: 2, drilledAt: 300 },
    ];

    const plan = buildExecutionPlan(holes, {
      stepRadialMm: 25,
      stepAngleDeg: 30,
      ringRadii: [200, 150, 100],
    });

    expect(plan.totalHoles).toBe(9);
    expect(plan.totalPlunges).toBe(3);
    expect(plan.bands).toHaveLength(3);

    // Bands must be strictly outer to inner
    expect(plan.bands[0].nominalR).toBe(200);
    expect(plan.bands[0].matchingLayerName).toBe('L1');

    expect(plan.bands[1].nominalR).toBe(150);
    expect(plan.bands[1].matchingLayerName).toBe('L2');

    expect(plan.bands[2].nominalR).toBe(100);
    expect(plan.bands[2].matchingLayerName).toBe('L3');

    // Steps must never have deltaR > 0 (strictly non-positive)
    for (const step of plan.steps) {
      expect(step.deltaR).toBeLessThanOrEqual(0);
    }

    // Yo-Yo was eliminated from historical jump
    expect(plan.yoYoReversalsEliminated).toBeGreaterThan(0);
    expect(plan.totalRadialTravelMm).toBe(100); // 200 - 100 = 100mm
  });

  it('correctly identifies intermediate off-grid bands (e.g. 24mm split between layers)', () => {
    const holes: PlanHole[] = [
      // Standard layer 1 at 200mm
      { id: '1', layer: 0, r: 200, a: 0, head: 0, drilledAt: 10 },
      // Intermediate cut at 176mm (24mm inward)
      { id: '2', layer: 0, r: 176, a: 0, head: 0, drilledAt: 20 },
      // Standard layer 2 at 152mm (48mm inward from L1)
      { id: '3', layer: 1, r: 152, a: 0, head: 0, drilledAt: 30 },
    ];

    const plan = buildExecutionPlan(holes, {
      stepRadialMm: 24,
      stepAngleDeg: 30,
      ringRadii: [200, 152], // s = 48mm
    });

    expect(plan.bands).toHaveLength(3);
    expect(plan.bands[0].nominalR).toBe(200);
    expect(plan.bands[0].matchingLayerName).toBe('L1');

    expect(plan.bands[1].nominalR).toBe(176);
    expect(plan.bands[1].matchingLayerName).toBe('Off-grid');

    expect(plan.bands[2].nominalR).toBe(152);
    expect(plan.bands[2].matchingLayerName).toBe('L2');
  });

  it('groups 3 synchronized head holes at same table angle into single plunge step', () => {
    // Plunge at table angle 45°
    // head 0: a = 315°
    // head 1: a = 75°
    // head 2: a = 195°
    const holes: PlanHole[] = [
      { id: 'h0', layer: 0, r: 180, a: 315, head: 0, drilledAt: 1 },
      { id: 'h1', layer: 0, r: 180, a: 75, head: 1, drilledAt: 1 },
      { id: 'h2', layer: 0, r: 180, a: 195, head: 2, drilledAt: 1 },
    ];

    const plan = buildExecutionPlan(holes, {
      stepRadialMm: 15,
      stepAngleDeg: 15,
    });

    expect(plan.steps).toHaveLength(1);
    expect(plan.steps[0].holesCount).toBe(3);
    expect(plan.steps[0].isFullTriad).toBe(true);
    expect(plan.steps[0].thetaDeg).toBe(45);
    expect(plan.steps[0].heads).toEqual([0, 1, 2]);
  });

  it('guarantees sequential 1-based stepIndex for each plunge in outer-to-inner plan', () => {
    const holes: PlanHole[] = [
      // Outer ring 200mm, 2 plunges
      { id: 'h1', layer: 0, r: 200, a: 0, head: 0, drilledAt: 1 },
      { id: 'h2', layer: 0, r: 200, a: 30, head: 0, drilledAt: 2 },
      // Inner ring 150mm, 2 plunges
      { id: 'h3', layer: 1, r: 150, a: 0, head: 0, drilledAt: 3 },
      { id: 'h4', layer: 1, r: 150, a: 30, head: 0, drilledAt: 4 },
    ];

    const plan = buildExecutionPlan(holes, {
      stepRadialMm: 25,
      stepAngleDeg: 30,
    });

    expect(plan.steps).toHaveLength(4);
    expect(plan.steps.map((s) => s.stepIndex)).toEqual([1, 2, 3, 4]);

    // First two steps are on 200mm, last two are on 150mm
    expect(plan.steps[0].rMm).toBe(200);
    expect(plan.steps[1].rMm).toBe(200);
    expect(plan.steps[2].rMm).toBe(150);
    expect(plan.steps[3].rMm).toBe(150);

    // Hole IDs can be looked up to identify exact stepIndex
    const holeToStep = new Map<string, number>();
    plan.steps.forEach((s) => s.holes.forEach((h) => holeToStep.set(h.id, s.stepIndex)));

    expect(holeToStep.get('h1')).toBe(1);
    expect(holeToStep.get('h2')).toBe(2);
    expect(holeToStep.get('h3')).toBe(3);
    expect(holeToStep.get('h4')).toBe(4);
  });

  it('builds preview plan directly from planned grid even when holes array is empty', () => {
    // 4 layers, 12 points per layer (stepAngle = 30°)
    const ringRadii = [200, 160, 120, 80];
    const nPoints = 12;
    const stepAngleDeg = 30;
    const stepRadialMm = 40;

    const previewPlan = buildPreviewPlan({
      ringRadii,
      nPoints,
      stepAngleDeg,
      stepRadialMm,
    });

    // Total holes = 4 * 12 = 48
    expect(previewPlan.totalHoles).toBe(48);
    // With 3 heads at 120°, 12 points per layer are drilled in 12 / 3 = 4 plunges
    // Total plunges = 4 layers * 4 plunges = 16
    expect(previewPlan.totalPlunges).toBe(16);
    expect(previewPlan.bands).toHaveLength(4);
    expect(previewPlan.steps).toHaveLength(16);

    // Strict Outer -> Inner
    expect(previewPlan.bands[0].nominalR).toBe(200);
    expect(previewPlan.bands[3].nominalR).toBe(80);

    // Every step must be a full triad of 3 holes with heads [0, 1, 2]
    for (const step of previewPlan.steps) {
      expect(step.holesCount).toBe(3);
      expect(step.isFullTriad).toBe(true);
      expect(step.heads).toEqual([0, 1, 2]);
    }
  });

  it('supports single-layer preview plan filtering (layerFilter)', () => {
    const ringRadii = [200, 150, 100];
    const nPoints = 12;

    const layer1Plan = buildPreviewPlan({
      ringRadii,
      nPoints,
      stepAngleDeg: 30,
      stepRadialMm: 50,
      layerFilter: 1, // Second layer: 150mm
    });

    expect(layer1Plan.totalHoles).toBe(12);
    expect(layer1Plan.totalPlunges).toBe(4);
    expect(layer1Plan.bands).toHaveLength(1);
    expect(layer1Plan.bands[0].nominalR).toBe(150);
    expect(layer1Plan.bands[0].matchingLayerName).toBe('L2');
  });
});

