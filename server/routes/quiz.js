const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const { calculateBaselineScore, EMISSION_FACTORS } = require('../services/scoreService');

const router = express.Router();

const { z } = require('zod');

const quizSchema = z.object({
  diet: z.enum(['vegan', 'vegetarian', 'pescatarian', 'omnivore', 'heavy_meat'], {
    errorMap: () => ({ message: 'Invalid diet type' })
  }),
  shopping: z.enum(['minimal', 'average', 'frequent'], {
    errorMap: () => ({ message: 'Invalid shopping habit' })
  }),
  transport: z.object({
    mode: z.enum(['car_petrol', 'car_diesel', 'car_electric', 'bike', 'public_transit', 'walk'], {
      errorMap: () => ({ message: 'Invalid transport mode' })
    }),
    weeklyKm: z.coerce.number()
      .min(0, 'Weekly distance must be a positive number under 10,000 km')
      .max(10000, 'Weekly distance must be a positive number under 10,000 km')
  }, { required_error: 'Transport details are required' }),
  energy: z.object({
    source: z.enum(['renewable', 'mixed', 'coal'], {
      errorMap: () => ({ message: 'Invalid energy source' })
    }),
    monthlyKwh: z.coerce.number()
      .min(0, 'Monthly energy usage must be a positive number under 50,000 kWh')
      .max(50000, 'Monthly energy usage must be a positive number under 50,000 kWh')
  }, { required_error: 'Energy details are required' }),
  flights: z.object({
    shortHaul: z.coerce.number()
      .int('Short-haul flights must be a positive integer under 365')
      .min(0, 'Short-haul flights must be a positive integer under 365')
      .max(365, 'Short-haul flights must be a positive integer under 365'),
    longHaul: z.coerce.number()
      .int('Long-haul flights must be a positive integer under 365')
      .min(0, 'Long-haul flights must be a positive integer under 365')
      .max(365, 'Long-haul flights must be a positive integer under 365')
  }, { required_error: 'Flights details are required' })
});

const validateQuizSubmit = (req, res, next) => {
  const { transport, diet, energy, shopping, flights } = req.body;
  if (!transport || !diet || !energy || !shopping || !flights) {
    return res.status(400).json({ error: 'All quiz fields are required' });
  }

  const result = quizSchema.safeParse(req.body);
  if (!result.success) {
    const errorMsg = result.error.errors[0].message;
    return res.status(400).json({ error: errorMsg });
  }
  
  req.body = result.data;
  next();
};

// GET /api/quiz/emission-factors
router.get('/emission-factors', auth, (req, res) => {
  res.json(EMISSION_FACTORS);
});

// POST /api/quiz/submit
router.post('/submit', auth, validateQuizSubmit, async (req, res) => {
  try {
    const { transport, diet, energy, shopping, flights } = req.body;

    const answers = {
      transport: {
        mode: transport.mode,
        weeklyKm: transport.weeklyKm
      },
      diet,
      energy: {
        source: energy.source,
        monthlyKwh: energy.monthlyKwh
      },
      shopping,
      flights: {
        shortHaul: flights.shortHaul,
        longHaul: flights.longHaul
      }
    };

    const { total, breakdown } = calculateBaselineScore(answers);

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.quizAnswers = answers;
    user.baselineScore = total;
    user.currentScore = total;
    user.scoreBreakdown = breakdown;
    user.onboardingComplete = true;
    user.addDailySnapshot(total);
    await user.save();

    res.json({
      baselineScore: total,
      currentScore: total,
      scoreBreakdown: breakdown,
      message: 'Onboarding complete! Your Carbon Twin awaits.'
    });
  } catch (error) {
    console.error('Quiz submit error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
