/**
 * Score Service — Carbon footprint calculation engine
 * 
 * All emission factors are based on peer-reviewed research and
 * international organization data (IPCC, EPA, DEFRA).
 */

// ─── EMISSION FACTORS ─────────────────────────────────────────
const { EMISSION_FACTORS } = require('../config/emissionFactors');

// Global comparison benchmarks (kg CO₂/year)
const BENCHMARKS = {
  world_average: 4000,
  india_average: 1800,
  paris_target: 2000,
  eu_average: 6800,
  us_average: 16000
};

// ─── SCORE CALCULATION ────────────────────────────────────────

/**
 * Calculate baseline annual carbon footprint from quiz answers
 * @param {Object} answers - Quiz answers object
 * @returns {Object} - { total, breakdown }
 */
function calculateBaselineScore(answers) {
  const breakdown = {};

  // Transport: weekly km → annual
  const transportFactor = EMISSION_FACTORS.transport[answers.transport.mode] || 0;
  breakdown.transport = Math.round(transportFactor * answers.transport.weeklyKm * 52);

  // Diet: annual directly
  breakdown.diet = EMISSION_FACTORS.diet[answers.diet] || EMISSION_FACTORS.diet.omnivore;

  // Energy: monthly kWh → annual
  const energyFactor = EMISSION_FACTORS.energy[answers.energy.source] || EMISSION_FACTORS.energy.mixed;
  breakdown.energy = Math.round(energyFactor * answers.energy.monthlyKwh * 12);

  // Shopping: annual directly
  breakdown.shopping = EMISSION_FACTORS.shopping[answers.shopping] || EMISSION_FACTORS.shopping.average;

  // Flights: per flight × count
  breakdown.flights = Math.round(
    (answers.flights.shortHaul * EMISSION_FACTORS.flights.shortHaul) +
    (answers.flights.longHaul * EMISSION_FACTORS.flights.longHaul)
  );

  const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  return { total: Math.round(total), breakdown };
}

/**
 * Calculate CO₂ delta for an action
 * @param {string} category
 * @param {string} action
 * @param {number} [km] - Only for transport actions
 * @param {Object} [userQuizAnswers] - User's quiz answers for baseline comparison
 * @returns {number} kg CO₂ delta (negative = reduction)
 */
function calculateActionDelta(category, action, km = 0, userQuizAnswers = null) {
  if (category === 'transport') {
    if (action === 'took_car' && km > 0) {
      const mode = userQuizAnswers?.transport?.mode || 'car_petrol';
      const factor = EMISSION_FACTORS.transport[mode] || 0.21;
      return Math.round(factor * km * 100) / 100;
    }
    if (action === 'cycled_walked' && km > 0) {
      const mode = userQuizAnswers?.transport?.mode || 'car_petrol';
      const factor = EMISSION_FACTORS.transport[mode] || 0.21;
      return -Math.round(factor * km * 100) / 100;
    }
  }

  const actionFactors = EMISSION_FACTORS.actions[category];
  if (actionFactors && actionFactors[action] !== undefined && actionFactors[action] !== null) {
    return actionFactors[action];
  }

  return 0;
}

/**
 * Update user streak based on last log date
 * @param {Date|null} lastLogDate
 * @param {number} currentStreak
 * @returns {{ streak: number, streakAtRisk: boolean }}
 */
function updateStreak(lastLogDate, currentStreak) {
  if (!lastLogDate) {
    return { streak: 1, streakAtRisk: false };
  }

  const now = new Date();
  const last = new Date(lastLogDate);
  const hoursSince = (now - last) / (1000 * 60 * 60);
  
  // Calculate calendar day difference using UTC midnight timestamps
  const nowMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const lastMidnight = Date.UTC(last.getUTCFullYear(), last.getUTCMonth(), last.getUTCDate());
  const daysSince = Math.round((nowMidnight - lastMidnight) / (1000 * 60 * 60 * 24));

  if (daysSince === 0) {
    // Same day, no change
    return { streak: currentStreak, streakAtRisk: false };
  } else if (daysSince === 1) {
    // Consecutive day
    return { streak: currentStreak + 1, streakAtRisk: false };
  } else if (daysSince >= 2) {
    // Streak broken
    return { streak: 1, streakAtRisk: false };
  }

  return { streak: currentStreak, streakAtRisk: hoursSince >= 20 };
}

/**
 * Get streak status for a user (for warnings)
 */
function getStreakStatus(lastLogDate, currentStreak) {
  if (!lastLogDate) return { streakAtRisk: false, streakBroken: false };

  const hoursSince = (new Date() - new Date(lastLogDate)) / (1000 * 60 * 60);

  return {
    streakAtRisk: hoursSince >= 20 && hoursSince < 48,
    streakBroken: hoursSince >= 48,
    hoursSinceLastLog: Math.round(hoursSince)
  };
}

/**
 * Convert CO₂ savings to real-world equivalencies
 */
function getEquivalencies(kgCO2Saved) {
  return {
    treesPlanted: Math.round(kgCO2Saved / 21),          // 1 tree absorbs ~21kg CO₂/year
    kmNotDriven: Math.round(kgCO2Saved / 0.21),         // Average car emissions
    smartphonesCharged: Math.round(kgCO2Saved / 0.008), // ~8g CO₂ per full charge
    hoursLED: Math.round(kgCO2Saved / 0.005),           // ~5g CO₂ per hour of LED
    showers: Math.round(kgCO2Saved / 0.4)               // ~0.4kg per 8-min shower
  };
}

module.exports = {
  EMISSION_FACTORS,
  BENCHMARKS,
  calculateBaselineScore,
  calculateActionDelta,
  updateStreak,
  getStreakStatus,
  getEquivalencies
};
