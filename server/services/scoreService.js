/**
 * Score Service — Carbon footprint calculation engine
 * 
 * All emission factors are based on peer-reviewed research and
 * international organization data (IPCC, EPA, DEFRA).
 */

// ─── EMISSION FACTORS ─────────────────────────────────────────
const EMISSION_FACTORS = {
  transport: {
    // kg CO₂ per km — Source: UK DEFRA 2023 emission factors
    car_petrol: 0.21,
    car_diesel: 0.17,
    car_electric: 0.05,  // Includes electricity generation emissions
    bike: 0.0,
    public_transit: 0.089, // Average bus/train per passenger-km
    walk: 0.0
  },
  diet: {
    // kg CO₂ per year — Source: Scarborough et al., 2014; Poore & Nemecek, 2018
    vegan: 1500,
    vegetarian: 1700,
    pescatarian: 1900,
    omnivore: 2500,
    heavy_meat: 3300
  },
  energy: {
    // kg CO₂ per kWh — Source: IPCC 2021, IEA
    renewable: 0.05,   // Solar/wind lifecycle emissions
    mixed: 0.23,       // Global average grid mix
    coal: 0.82         // Coal-dominant grid
  },
  shopping: {
    // kg CO₂ per year — Source: WRAP, Ellen MacArthur Foundation
    minimal: 500,
    average: 1200,
    frequent: 2400
  },
  flights: {
    // kg CO₂ per flight (round trip) — Source: ICAO Carbon Emissions Calculator
    shortHaul: 255,    // < 3 hours
    longHaul: 1620     // > 6 hours, includes radiative forcing multiplier
  },
  // Daily action deltas (kg CO₂)
  actions: {
    transport: {
      took_car: null,  // Calculated based on km input
      public_transit: -0.3,
      cycled_walked: null, // Full car amount saved
      work_from_home: -1.2
    },
    meal: {
      vegan_meal: -0.5,
      vegetarian_meal: -0.3,
      meat_meal: 0.8,
      local_produce: -0.2
    },
    home: {
      ac_off_4hrs: -0.4,
      air_dry_laundry: -0.7,
      reduced_heating: -0.5
    },
    shopping: {
      secondhand_item: -1.2,
      avoid_plastic: -0.1,
      new_electronics: 30
    }
  }
};

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
  const daysSince = Math.floor(hoursSince / 24);

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
