import { describe, it, expect } from 'vitest';
import {
  calculateBaselineScore,
  getScoreColor,
  getScoreLabel,
  getAvatarHSL,
  getEquivalencies,
  formatNumber
} from '@src/utils/scoreCalculator.js';

// ─── calculateBaselineScore ──────────────────────────────────

describe('calculateBaselineScore', () => {
  const sampleAnswers = {
    transport: { mode: 'car_petrol', weeklyKm: 100 },
    diet: 'omnivore',
    energy: { source: 'mixed', monthlyKwh: 300 },
    shopping: 'average',
    flights: { shortHaul: 2, longHaul: 1 }
  };

  it('should return a total and breakdown', () => {
    const result = calculateBaselineScore(sampleAnswers);

    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('breakdown');
    expect(result.total).toBeGreaterThan(0);
  });

  it('should include all categories in breakdown', () => {
    const { breakdown } = calculateBaselineScore(sampleAnswers);

    expect(breakdown).toHaveProperty('transport');
    expect(breakdown).toHaveProperty('diet');
    expect(breakdown).toHaveProperty('energy');
    expect(breakdown).toHaveProperty('shopping');
    expect(breakdown).toHaveProperty('flights');
  });

  it('should calculate transport as weekly km × factor × 52', () => {
    const { breakdown } = calculateBaselineScore(sampleAnswers);
    expect(breakdown.transport).toBe(Math.round(0.21 * 100 * 52));
  });

  it('should handle missing/partial answers with defaults', () => {
    const partialAnswers = {};
    const result = calculateBaselineScore(partialAnswers);

    // Should not throw, should return reasonable defaults
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.breakdown).toBeDefined();
  });

  it('should return higher total for high-emission lifestyle', () => {
    const highAnswers = {
      transport: { mode: 'car_petrol', weeklyKm: 500 },
      diet: 'heavy_meat',
      energy: { source: 'coal', monthlyKwh: 800 },
      shopping: 'frequent',
      flights: { shortHaul: 6, longHaul: 4 }
    };
    const lowAnswers = {
      transport: { mode: 'bike', weeklyKm: 200 },
      diet: 'vegan',
      energy: { source: 'renewable', monthlyKwh: 100 },
      shopping: 'minimal',
      flights: { shortHaul: 0, longHaul: 0 }
    };

    const high = calculateBaselineScore(highAnswers);
    const low = calculateBaselineScore(lowAnswers);

    expect(high.total).toBeGreaterThan(low.total);
  });
});

// ─── getScoreColor ───────────────────────────────────────────

describe('getScoreColor', () => {
  it('should return green for excellent scores (≤1500)', () => {
    expect(getScoreColor(1000)).toBe('#10b981');
    expect(getScoreColor(1500)).toBe('#10b981');
  });

  it('should return light green for good scores (1501-2000)', () => {
    expect(getScoreColor(1800)).toBe('#34d399');
  });

  it('should return yellow for moderate scores (2001-3000)', () => {
    expect(getScoreColor(2500)).toBe('#fbbf24');
  });

  it('should return amber for warning scores (3001-4000)', () => {
    expect(getScoreColor(3500)).toBe('#f59e0b');
  });

  it('should return orange for above-average scores (4001-5000)', () => {
    expect(getScoreColor(4500)).toBe('#f97316');
  });

  it('should return red for high scores (>5000)', () => {
    expect(getScoreColor(6000)).toBe('#ef4444');
    expect(getScoreColor(10000)).toBe('#ef4444');
  });
});

// ─── getScoreLabel ───────────────────────────────────────────

describe('getScoreLabel', () => {
  it('should return "Excellent" for ≤1500', () => {
    expect(getScoreLabel(1000)).toBe('Excellent');
  });

  it('should return "Great" for 1501-2000', () => {
    expect(getScoreLabel(1800)).toBe('Great');
  });

  it('should return "Good" for 2001-3000', () => {
    expect(getScoreLabel(2500)).toBe('Good');
  });

  it('should return "Average" for 3001-4000', () => {
    expect(getScoreLabel(3500)).toBe('Average');
  });

  it('should return "Above Average" for 4001-5000', () => {
    expect(getScoreLabel(4500)).toBe('Above Average');
  });

  it('should return "High" for >5000', () => {
    expect(getScoreLabel(6000)).toBe('High');
  });
});

// ─── getAvatarHSL ────────────────────────────────────────────

describe('getAvatarHSL', () => {
  it('should return an object with h, s, l properties', () => {
    const result = getAvatarHSL(2000);

    expect(result).toHaveProperty('h');
    expect(result).toHaveProperty('s');
    expect(result).toHaveProperty('l');
  });

  it('should return values normalized between 0 and 1', () => {
    const scores = [500, 1000, 2000, 3000, 4000, 5000, 6000, 8000];

    for (const score of scores) {
      const { h, s, l } = getAvatarHSL(score);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThanOrEqual(1);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(1);
      expect(l).toBeGreaterThanOrEqual(0);
      expect(l).toBeLessThanOrEqual(1);
    }
  });

  it('should have higher hue (greener) for lower scores', () => {
    const low = getAvatarHSL(1000);
    const high = getAvatarHSL(5000);

    // Lower score = greener = higher hue value (closer to 120°/360)
    expect(low.h).toBeGreaterThan(high.h);
  });
});

// ─── getEquivalencies ────────────────────────────────────────

describe('getEquivalencies', () => {
  it('should return all equivalency fields', () => {
    const result = getEquivalencies(100);

    expect(result).toHaveProperty('treesPlanted');
    expect(result).toHaveProperty('kmNotDriven');
    expect(result).toHaveProperty('smartphonesCharged');
    expect(result).toHaveProperty('showers');
  });

  it('should calculate trees planted correctly', () => {
    expect(getEquivalencies(210).treesPlanted).toBe(10);
  });

  it('should calculate km not driven correctly', () => {
    expect(getEquivalencies(21).kmNotDriven).toBe(100);
  });

  it('should handle negative values (absolute)', () => {
    const result = getEquivalencies(-100);
    expect(result.treesPlanted).toBeGreaterThanOrEqual(0);
  });

  it('should return zeros for zero input', () => {
    const result = getEquivalencies(0);
    expect(result.treesPlanted).toBe(0);
    expect(result.kmNotDriven).toBe(0);
  });
});

// ─── formatNumber ────────────────────────────────────────────

describe('formatNumber', () => {
  it('should round to integer', () => {
    const result = formatNumber(1234.56);
    // toLocaleString may produce "1,235" or "1235" depending on locale
    expect(result).toMatch(/1[,.]?235/);
  });

  it('should handle zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('should handle negative numbers', () => {
    const result = formatNumber(-1500.7);
    expect(result).toMatch(/-?1[,.]?501/);
  });
});
