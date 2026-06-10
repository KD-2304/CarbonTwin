import { EMISSION_FACTORS } from './emissionFactors';

/**
 * Calculate baseline annual carbon score from quiz answers
 */
export function calculateBaselineScore(answers) {
  const breakdown = {};

  // Transport
  const transportMode = answers.transport?.mode || 'car_petrol';
  const transportFactor = EMISSION_FACTORS.transport[transportMode]?.factor || 0;
  breakdown.transport = Math.round(transportFactor * (answers.transport?.weeklyKm || 0) * 52);

  // Diet
  breakdown.diet = EMISSION_FACTORS.diet[answers.diet]?.annual || 2500;

  // Energy
  const energyFactor = EMISSION_FACTORS.energy[answers.energy?.source]?.factor || 0.23;
  breakdown.energy = Math.round(energyFactor * (answers.energy?.monthlyKwh || 0) * 12);

  // Shopping
  breakdown.shopping = EMISSION_FACTORS.shopping[answers.shopping]?.annual || 1200;

  // Flights
  breakdown.flights = Math.round(
    ((answers.flights?.shortHaul || 0) * EMISSION_FACTORS.flights.shortHaul.perFlight) +
    ((answers.flights?.longHaul || 0) * EMISSION_FACTORS.flights.longHaul.perFlight)
  );

  const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
  return { total: Math.round(total), breakdown };
}

/**
 * Get score color based on annual CO₂ score
 * Returns HSL color string
 */
export function getScoreColor(score) {
  if (score <= 1500) return '#10b981'; // Excellent green
  if (score <= 2000) return '#34d399'; // Good green
  if (score <= 3000) return '#fbbf24'; // Moderate yellow
  if (score <= 4000) return '#f59e0b'; // Warning amber
  if (score <= 5000) return '#f97316'; // Orange
  return '#ef4444'; // Poor red
}

/**
 * Get score label
 */
export function getScoreLabel(score) {
  if (score <= 1500) return 'Excellent';
  if (score <= 2000) return 'Great';
  if (score <= 3000) return 'Good';
  if (score <= 4000) return 'Average';
  if (score <= 5000) return 'Above Average';
  return 'High';
}

/**
 * Get HSL values for Three.js avatar color
 * Returns { h, s, l } normalized for Three.js (h: 0-1, s: 0-1, l: 0-1)
 */
export function getAvatarHSL(score) {
  // Green (120°) at score 1000 → Yellow (60°) at 3000 → Orange (30°) at 4000 → Gray (0°, low sat) at 6000+
  const t = Math.min(1, Math.max(0, (score - 1000) / 5000));

  let h, s, l;
  if (t < 0.3) {
    // Green zone
    h = 140 / 360;
    s = 0.7;
    l = 0.45 + (t / 0.3) * 0.1;
  } else if (t < 0.5) {
    // Yellow zone
    const p = (t - 0.3) / 0.2;
    h = (140 - p * 95) / 360;
    s = 0.7 + p * 0.1;
    l = 0.55;
  } else if (t < 0.7) {
    // Orange zone
    const p = (t - 0.5) / 0.2;
    h = (45 - p * 20) / 360;
    s = 0.75 - p * 0.1;
    l = 0.5;
  } else {
    // Gray zone
    const p = (t - 0.7) / 0.3;
    h = 25 / 360;
    s = 0.65 - p * 0.55;
    l = 0.5 - p * 0.2;
  }

  return { h, s, l };
}

/**
 * Get equivalencies for CO₂ savings
 */
export function getEquivalencies(kgCO2Saved) {
  const abs = Math.abs(kgCO2Saved);
  return {
    treesPlanted: Math.round(abs / 21),
    kmNotDriven: Math.round(abs / 0.21),
    smartphonesCharged: Math.round(abs / 0.008),
    showers: Math.round(abs / 0.4)
  };
}

/**
 * Format number with commas
 */
export function formatNumber(num) {
  return Math.round(num).toLocaleString();
}
