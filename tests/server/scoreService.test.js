const {
  calculateBaselineScore,
  calculateActionDelta,
  updateStreak,
  getStreakStatus,
  getEquivalencies
} = require('../../server/services/scoreService');

// ─── calculateBaselineScore ──────────────────────────────────

describe('calculateBaselineScore', () => {
  const sampleAnswers = {
    transport: { mode: 'car_petrol', weeklyKm: 100 },
    diet: 'omnivore',
    energy: { source: 'mixed', monthlyKwh: 300 },
    shopping: 'average',
    flights: { shortHaul: 2, longHaul: 1 }
  };

  it('should return a total and breakdown object', () => {
    const result = calculateBaselineScore(sampleAnswers);

    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('breakdown');
    expect(typeof result.total).toBe('number');
    expect(result.total).toBeGreaterThan(0);
  });

  it('should include all five categories in the breakdown', () => {
    const { breakdown } = calculateBaselineScore(sampleAnswers);

    expect(breakdown).toHaveProperty('transport');
    expect(breakdown).toHaveProperty('diet');
    expect(breakdown).toHaveProperty('energy');
    expect(breakdown).toHaveProperty('shopping');
    expect(breakdown).toHaveProperty('flights');
  });

  it('should calculate transport correctly (weekly km × factor × 52)', () => {
    const { breakdown } = calculateBaselineScore(sampleAnswers);

    // car_petrol = 0.21 kg/km, 100 km/week × 52 weeks = 1092
    expect(breakdown.transport).toBe(Math.round(0.21 * 100 * 52));
  });

  it('should use diet annual value directly', () => {
    const { breakdown } = calculateBaselineScore(sampleAnswers);

    // omnivore = 2500 annual
    expect(breakdown.diet).toBe(2500);
  });

  it('should calculate energy correctly (monthly kWh × factor × 12)', () => {
    const { breakdown } = calculateBaselineScore(sampleAnswers);

    // mixed = 0.23 kg/kWh, 300 kWh/month × 12 = 828
    expect(breakdown.energy).toBe(Math.round(0.23 * 300 * 12));
  });

  it('should calculate flights correctly', () => {
    const { breakdown } = calculateBaselineScore(sampleAnswers);

    // 2 short-haul × 255 + 1 long-haul × 1620 = 2130
    expect(breakdown.flights).toBe(Math.round(2 * 255 + 1 * 1620));
  });

  it('should return zero transport for bike/walk modes', () => {
    const bikeAnswers = {
      ...sampleAnswers,
      transport: { mode: 'bike', weeklyKm: 200 }
    };
    const { breakdown } = calculateBaselineScore(bikeAnswers);

    expect(breakdown.transport).toBe(0);
  });

  it('should sum all breakdown values to equal total', () => {
    const result = calculateBaselineScore(sampleAnswers);
    const sum = Object.values(result.breakdown).reduce((a, b) => a + b, 0);

    expect(result.total).toBe(Math.round(sum));
  });
});

// ─── calculateActionDelta ────────────────────────────────────

describe('calculateActionDelta', () => {
  it('should return a negative delta for public transit', () => {
    const delta = calculateActionDelta('transport', 'public_transit');
    expect(delta).toBe(-0.3);
  });

  it('should return a positive delta for meat meal', () => {
    const delta = calculateActionDelta('meal', 'meat_meal');
    expect(delta).toBe(0.8);
  });

  it('should return a negative delta for vegan meal', () => {
    const delta = calculateActionDelta('meal', 'vegan_meal');
    expect(delta).toBe(-0.5);
  });

  it('should calculate car km-based delta', () => {
    const delta = calculateActionDelta('transport', 'took_car', 10);
    // 10km × 0.21 = 2.1
    expect(delta).toBeCloseTo(2.1, 1);
  });

  it('should calculate cycling savings based on car emissions avoided', () => {
    const delta = calculateActionDelta('transport', 'cycled_walked', 10);
    // -10km × 0.21 = -2.1
    expect(delta).toBeCloseTo(-2.1, 1);
  });

  it('should use user transport mode when provided', () => {
    const userAnswers = { transport: { mode: 'car_diesel' } };
    const delta = calculateActionDelta('transport', 'took_car', 10, userAnswers);
    // 10km × 0.17 = 1.7
    expect(delta).toBeCloseTo(1.7, 1);
  });

  it('should return 0 for unknown action', () => {
    const delta = calculateActionDelta('transport', 'unknown_action');
    expect(delta).toBe(0);
  });

  it('should return large positive delta for new electronics', () => {
    const delta = calculateActionDelta('shopping', 'new_electronics');
    expect(delta).toBe(30);
  });
});

// ─── updateStreak ────────────────────────────────────────────

describe('updateStreak', () => {
  it('should start a new streak when lastLogDate is null', () => {
    const result = updateStreak(null, 0);
    expect(result.streak).toBe(1);
    expect(result.streakAtRisk).toBe(false);
  });

  it('should keep the same streak for same-day logs', () => {
    const now = new Date();
    const result = updateStreak(now, 5);
    expect(result.streak).toBe(5);
  });

  it('should increment streak for consecutive days', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0);

    const result = updateStreak(yesterday, 5);
    expect(result.streak).toBe(6);
  });

  it('should reset streak after 2+ days gap', () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const result = updateStreak(threeDaysAgo, 10);
    expect(result.streak).toBe(1);
  });
});

// ─── getStreakStatus ─────────────────────────────────────────

describe('getStreakStatus', () => {
  it('should return no risk when lastLogDate is null', () => {
    const result = getStreakStatus(null, 5);
    expect(result.streakAtRisk).toBe(false);
    expect(result.streakBroken).toBe(false);
  });

  it('should detect streak at risk (20-48 hours)', () => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = getStreakStatus(twentyFourHoursAgo, 5);
    expect(result.streakAtRisk).toBe(true);
    expect(result.streakBroken).toBe(false);
  });

  it('should detect streak broken (48+ hours)', () => {
    const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const result = getStreakStatus(threeDaysAgo, 5);
    expect(result.streakBroken).toBe(true);
  });
});

// ─── getEquivalencies ────────────────────────────────────────

describe('getEquivalencies', () => {
  it('should return all equivalency fields', () => {
    const result = getEquivalencies(100);

    expect(result).toHaveProperty('treesPlanted');
    expect(result).toHaveProperty('kmNotDriven');
    expect(result).toHaveProperty('smartphonesCharged');
    expect(result).toHaveProperty('hoursLED');
    expect(result).toHaveProperty('showers');
  });

  it('should calculate trees planted correctly (1 tree = 21kg CO₂)', () => {
    const result = getEquivalencies(210);
    expect(result.treesPlanted).toBe(10);
  });

  it('should calculate km not driven correctly', () => {
    const result = getEquivalencies(21);
    // 21 / 0.21 = 100
    expect(result.kmNotDriven).toBe(100);
  });

  it('should return zero equivalencies for zero input', () => {
    const result = getEquivalencies(0);
    expect(result.treesPlanted).toBe(0);
    expect(result.kmNotDriven).toBe(0);
    expect(result.smartphonesCharged).toBe(0);
  });
});
