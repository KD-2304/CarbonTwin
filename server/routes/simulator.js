const express = require('express');
const { z } = require('zod');
const auth = require('../middleware/auth');
const { EMISSION_FACTORS, getEquivalencies, calculateBaselineScore } = require('../services/scoreService');

const router = express.Router();

const quizSchema = z.object({
  diet: z.enum(['vegan', 'vegetarian', 'pescatarian', 'omnivore', 'heavy_meat'], {
    message: 'Invalid diet type'
  }),
  shopping: z.enum(['minimal', 'average', 'frequent'], {
    message: 'Invalid shopping habit'
  }),
  transport: z.object({
    mode: z.enum(['car_petrol', 'car_diesel', 'car_electric', 'bike', 'public_transit', 'walk'], {
      message: 'Invalid transport mode'
    }),
    weeklyKm: z.coerce.number()
      .min(0, 'Weekly distance must be a positive number under 10,000 km')
      .max(10000, 'Weekly distance must be a positive number under 10,000 km')
  }),
  energy: z.object({
    source: z.enum(['renewable', 'mixed', 'coal'], {
      message: 'Invalid energy source'
    }),
    monthlyKwh: z.coerce.number()
      .min(0, 'Monthly energy usage must be a positive number under 50,000 kWh')
      .max(50000, 'Monthly energy usage must be a positive number under 50,000 kWh')
  }),
  flights: z.object({
    shortHaul: z.coerce.number()
      .int('Short-haul flights must be a positive integer under 365')
      .min(0, 'Short-haul flights must be a positive integer under 365')
      .max(365, 'Short-haul flights must be a positive integer under 365'),
    longHaul: z.coerce.number()
      .int('Long-haul flights must be a positive integer under 365')
      .min(0, 'Long-haul flights must be a positive integer under 365')
      .max(365, 'Long-haul flights must be a positive integer under 365')
  })
});

const modificationsSchema = z.object({
  goVegetarian: z.boolean().optional(),
  goVegan: z.boolean().optional(),
  cycleInsteadOfDrive: z.boolean().optional(),
  cycleDays: z.coerce.number().min(0).max(7).optional(),
  cutLongHaulFlight: z.boolean().optional(),
  cutShortHaulFlight: z.boolean().optional(),
  switchToRenewable: z.boolean().optional(),
  reduceShoppingToMinimal: z.boolean().optional()
}).optional().default({});

const simulatorSchema = z.object({
  currentAnswers: quizSchema,
  modifications: modificationsSchema
});

// POST /api/simulator/calculate
router.post('/calculate', auth, (req, res) => {
  try {
    const result = simulatorSchema.safeParse(req.body);
    if (!result.success) {
      const errorMsg = result.error.issues[0].message;
      return res.status(400).json({ error: errorMsg });
    }

    const { currentAnswers, modifications } = result.data;

    // Calculate current score from answers
    const current = calculateBaselineScore(currentAnswers);

    // Apply modifications and recalculate
    const modified = { ...currentAnswers };

    if (modifications.goVegetarian) {
      modified.diet = 'vegetarian';
    }
    if (modifications.goVegan) {
      modified.diet = 'vegan';
    }
    if (modifications.cycleInsteadOfDrive) {
      modified.transport = {
        ...modified.transport,
        mode: 'bike',
        weeklyKm: modified.transport.weeklyKm * (modifications.cycleDays || 3) / 7
      };
    }
    if (modifications.cutLongHaulFlight) {
      modified.flights = {
        ...modified.flights,
        longHaul: Math.max(0, modified.flights.longHaul - 1)
      };
    }
    if (modifications.cutShortHaulFlight) {
      modified.flights = {
        ...modified.flights,
        shortHaul: Math.max(0, modified.flights.shortHaul - 1)
      };
    }
    if (modifications.switchToRenewable) {
      modified.energy = { ...modified.energy, source: 'renewable' };
    }
    if (modifications.reduceShoppingToMinimal) {
      modified.shopping = 'minimal';
    }

    const simulated = calculateBaselineScore(modified);
    const savings = current.total - simulated.total;

    res.json({
      currentScore: current.total,
      simulatedScore: simulated.total,
      savings,
      currentBreakdown: current.breakdown,
      simulatedBreakdown: simulated.breakdown,
      equivalencies: getEquivalencies(savings)
    });
  } catch (error) {
    console.error('Simulator error:', error);
    res.status(500).json({ error: 'Calculation error' });
  }
});

module.exports = router;
