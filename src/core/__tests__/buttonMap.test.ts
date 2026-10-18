import { describe, it, expect } from 'vitest';
import { generateButtonMap, angleDistanceCW } from '../buttonMap';

describe('Button Map Generator (S4 - Kinematics & Mechanics)', () => {
  it('calculates CW angular distance correctly', () => {
    // 0° to 330° in CW is 30°
    expect(angleDistanceCW(0, 330)).toBe(30);
    // 330° to 300° in CW is 30°
    expect(angleDistanceCW(330, 300)).toBe(30);
    // 270° to 0° in CW is 270°
    expect(angleDistanceCW(270, 0)).toBe(270);
    // Same angle
    expect(angleDistanceCW(180, 180)).toBe(0);
  });

  it('starts with (0 HOME) and (r MAX)', () => {
    const result = generateButtonMap({
      ringRadii: [180, 150, 120],
      nPoints: 12,
      stepAngleDeg: 30,
      stepRadialMm: 30,
      rHeadMinMm: 40,
    });

    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.steps[0].action).toBe('HOME');
    expect(result.steps[0].buttonLabel).toBe('(0 HOME)');
    expect(result.steps[1].action).toBe('R_MAX');
    expect(result.steps[1].buttonLabel).toBe('(r MAX)');
  });

  it('produces condensed button sequence matching user specification', () => {
    const result = generateButtonMap({
      ringRadii: [180, 150],
      nPoints: 12,
      stepAngleDeg: 30,
      stepRadialMm: 30,
      rHeadMinMm: 40,
    });

    expect(result.condensedString).toContain('(0 HOME) > (r MAX) > (PUSH)');
    expect(result.condensedString).toContain('(θ+)');
    expect(result.condensedString).toContain('(r−)');
    expect(result.totalPlunges).toBe(8); // 4 plunges per ring * 2 rings = 8 plunges
    expect(result.totalHoles).toBe(24); // 8 * 3 = 24 holes
  });

  it('guarantees strictly unidirectional CW rotation across all steps', () => {
    const result = generateButtonMap({
      ringRadii: [200, 170, 140, 110],
      nPoints: 24,
      stepAngleDeg: 15,
      stepRadialMm: 30,
      rHeadMinMm: 50,
    });

    let prevTheta = 0;
    for (const step of result.steps) {
      if (step.action === 'THETA_PLUS') {
        const dCW = angleDistanceCW(prevTheta, step.thetaDeg);
        expect(dCW).toBeGreaterThan(0);
        expect(dCW).toBeLessThan(360);
        prevTheta = step.thetaDeg;
      } else if (step.action === 'R_MINUS') {
        // Table angle should NOT change during radial step!
        expect(step.thetaDeg).toBe(prevTheta);
      }
    }
  });

  it('preserves table angle during inter-layer radial transition (no reset to 0)', () => {
    const result = generateButtonMap({
      ringRadii: [180, 150],
      nPoints: 12,
      stepAngleDeg: 30,
      stepRadialMm: 30,
      rHeadMinMm: 40,
    });

    const rMinusStep = result.steps.find((s) => s.action === 'R_MINUS');
    expect(rMinusStep).toBeDefined();

    // The step before R_MINUS could be a PUSH on Layer 1 or THETA_PLUS
    const rMinusIdx = result.steps.indexOf(rMinusStep!);
    const prevStep = result.steps[rMinusIdx - 1];
    
    // Check theta continuity
    expect(rMinusStep!.thetaDeg).toBe(prevStep.thetaDeg);
  });
});
