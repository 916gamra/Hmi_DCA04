/**
 * Unit tests for pure math helpers.
 *
 * These are the foundation of the whole app — every geometry
 * calculation depends on them, so they must be rock solid.
 */
import { describe, it, expect } from 'vitest';
import {
  clamp,
  clampInt,
  norm360,
  sanitizeN,
  toMm,
  fmt,
  fmtTime,
  ease,
} from '../model';

// ─────────────────────────────────────────────────────────
// clamp
// ─────────────────────────────────────────────────────────
describe('clamp', () => {
  it.each([
    [5, 0, 10, 5],
    [-5, 0, 10, 0],
    [15, 0, 10, 10],
    [0, 0, 10, 0],
    [10, 0, 10, 10],
    [Infinity, -100, 100, 100],
    [-Infinity, -100, 100, -100],
    [-1e6, 0, 1, 0],
    [1e6, 0, 1, 1],
  ])('clamp(%p, %p, %p) === %p', (v, a, b, expected) => {
    expect(clamp(v, a, b)).toBe(expected);
  });

  it('returns exactly the value when in range', () => {
    expect(clamp(3.14159, 0, 10)).toBe(3.14159);
  });

  it('handles degenerate range a === b', () => {
    expect(clamp(5, 3, 3)).toBe(3);
    expect(clamp(-5, 3, 3)).toBe(3);
  });
});

// ─────────────────────────────────────────────────────────
// clampInt
// ─────────────────────────────────────────────────────────
describe('clampInt', () => {
  it.each([
    [5.4, 0, 10, 5],
    [5.5, 0, 10, 6],
    [5.6, 0, 10, 6],
    [-1.5, 0, 10, 0],
    [15.7, 0, 10, 10],
  ])('clampInt(%p, %p, %p) === %p', (v, a, b, expected) => {
    expect(clampInt(v, a, b)).toBe(expected);
  });
});

// ─────────────────────────────────────────────────────────
// norm360
// ─────────────────────────────────────────────────────────
describe('norm360', () => {
  it.each([
    [0, 0],
    [360, 0],
    [720, 0],
    [-360, 0],
    [-720, 0],
    [90, 90],
    [450, 90],
    [-90, 270],
    [-450, 270],
    [180, 180],
    [-180, 180],
    [359.9, 359.9],
  ])('norm360(%p) === %p', (input, expected) => {
    expect(norm360(input)).toBeCloseTo(expected, 6);
  });

  it('always returns a value in [0, 360)', () => {
    for (let i = -1080; i <= 1080; i += 7) {
      const r = norm360(i);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(360);
    }
  });

  it('is idempotent', () => {
    for (const v of [0, 45, 90, 123.45, 359.99, -100, -400]) {
      expect(norm360(norm360(v))).toBeCloseTo(norm360(v), 6);
    }
  });

  it('is additive modulo 360', () => {
    for (let i = 0; i < 20; i++) {
      const a = i * 37;
      const b = i * 91;
      const r = norm360(norm360(a) + norm360(b));
      expect(r).toBeCloseTo(norm360(a + b), 6);
    }
  });
});

// ─────────────────────────────────────────────────────────
// sanitizeN
// ─────────────────────────────────────────────────────────
describe('sanitizeN', () => {
  describe('enforceMultipleOf3 = true (default)', () => {
    it.each([
      [3, 3], [4, 3], [5, 6], [6, 6],
      [7, 6], [8, 9], [9, 9],
      [10, 9], [11, 12], [12, 12],
      [120, 120], [121, 120], [1000, 120],
    ])('sanitizeN(%p) === %p', (input, expected) => {
      expect(sanitizeN(input)).toBe(expected);
    });

    it('clamps below to 3', () => {
      expect(sanitizeN(0)).toBe(3);
      expect(sanitizeN(-100)).toBe(3);
      expect(sanitizeN(-Infinity)).toBe(3);
    });

    it('clamps above to 120', () => {
      expect(sanitizeN(999)).toBe(120);
      expect(sanitizeN(Infinity)).toBe(120);
    });

    it('treats NaN as default 12', () => {
      expect(sanitizeN(NaN)).toBe(12);
    });

    it('always returns a multiple of 3', () => {
      for (let i = -50; i < 200; i++) {
        expect(sanitizeN(i) % 3).toBe(0);
      }
    });

    it('always returns an integer', () => {
      for (let i = 0; i < 200; i += 0.7) {
        expect(Number.isInteger(sanitizeN(i))).toBe(true);
      }
    });

    it('is idempotent', () => {
      for (const v of [3, 4, 5, 12, 100, -5, NaN]) {
        expect(sanitizeN(sanitizeN(v))).toBe(sanitizeN(v));
      }
    });
  });

  describe('enforceMultipleOf3 = false', () => {
    it('rounds to nearest integer', () => {
      expect(sanitizeN(4, false)).toBe(4);
      expect(sanitizeN(7, false)).toBe(7);
      expect(sanitizeN(4.4, false)).toBe(4);
      expect(sanitizeN(4.6, false)).toBe(5);
    });

    it('still clamps to [3, 120]', () => {
      expect(sanitizeN(0, false)).toBe(3);
      expect(sanitizeN(999, false)).toBe(120);
    });
  });
});

// ─────────────────────────────────────────────────────────
// toMm
// ─────────────────────────────────────────────────────────
describe('toMm', () => {
  it('cm → mm multiplies by 10', () => {
    expect(toMm(1, 'cm')).toBe(10);
    expect(toMm(30, 'cm')).toBe(300);
    expect(toMm(0.5, 'cm')).toBe(5);
  });

  it('mm → mm passes through', () => {
    expect(toMm(1, 'mm')).toBe(1);
    expect(toMm(300, 'mm')).toBe(300);
    expect(toMm(0.5, 'mm')).toBe(0.5);
  });

  it('preserves zero and negatives', () => {
    expect(toMm(0, 'cm')).toBe(0);
    expect(toMm(-5, 'cm')).toBe(-50);
  });
});

// ─────────────────────────────────────────────────────────
// ease (ease-in-out cubic)
// ─────────────────────────────────────────────────────────
describe('ease', () => {
  it('passes through (0,0) and (1,1)', () => {
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
  });

  it('is symmetric around 0.5', () => {
    expect(ease(0.5)).toBeCloseTo(0.5, 6);
    for (const u of [0.1, 0.2, 0.3, 0.4]) {
      expect(ease(u) + ease(1 - u)).toBeCloseTo(1, 6);
    }
  });

  it('is monotonically increasing on [0, 1]', () => {
    let prev = -Infinity;
    for (let u = 0; u <= 1; u += 0.01) {
      const e = ease(u);
      expect(e).toBeGreaterThanOrEqual(prev);
      prev = e;
    }
  });

  it('flattens at endpoints (ease-in-out)', () => {
    expect(ease(0.001)).toBeLessThan(0.001);
    expect(1 - ease(0.999)).toBeLessThan(0.001);
  });

  it('stays inside [0, 1] for input in [0, 1]', () => {
    for (let u = 0; u <= 1; u += 0.01) {
      const e = ease(u);
      expect(e).toBeGreaterThanOrEqual(0);
      expect(e).toBeLessThanOrEqual(1);
    }
  });
});

// ─────────────────────────────────────────────────────────
// fmt / fmtTime
// ─────────────────────────────────────────────────────────
describe('fmt', () => {
  it.each([
    [0, 1, '0.0'],
    [1.23, 1, '1.2'],
    [1.25, 1, '1.3'],
    [1.26, 1, '1.3'],
    [Math.PI, 2, '3.14'],
  ])('fmt(%p, %p) === %p', (v, d, expected) => {
    expect(fmt(v, d)).toBe(expected);
  });

  it('renders -0 and near-zero as 0', () => {
    expect(fmt(-0, 1)).toBe('0.0');
    expect(fmt(-0.0000001, 1)).toBe('0.0');
    expect(fmt(-1e-9, 2)).toBe('0.00');
  });
});

describe('fmtTime', () => {
  it.each([
    [0, '0.0 ث'],
    [1000, '1.0 ث'],
    [500, '0.5 ث'],
    [59000, '59.0 ث'],
    [60000, '1د 0ث'],
    [90000, '1د 30ث'],
    [120000, '2د 0ث'],
  ])('fmtTime(%p) === %p', (ms, expected) => {
    expect(fmtTime(ms)).toBe(expected);
  });

  it('never produces NaN for finite inputs', () => {
    for (const ms of [0, 1, 999, 1000, 59999, 60000, 3600000]) {
      expect(fmtTime(ms)).not.toContain('NaN');
    }
  });
});
