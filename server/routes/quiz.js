const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const { calculateBaselineScore, EMISSION_FACTORS } = require('../services/scoreService');

const router = express.Router();

// GET /api/quiz/emission-factors
router.get('/emission-factors', auth, (req, res) => {
  res.json(EMISSION_FACTORS);
});

// POST /api/quiz/submit
router.post('/submit', auth, async (req, res) => {
  try {
    const { transport, diet, energy, shopping, flights } = req.body;

    // Validate required fields
    if (!transport || !diet || !energy || !shopping || !flights) {
      return res.status(400).json({ error: 'All quiz fields are required' });
    }

    // Input validation checks
    const validDiet = ['vegan', 'vegetarian', 'pescatarian', 'omnivore', 'heavy_meat'];
    const validTransport = ['car_petrol', 'car_diesel', 'car_electric', 'bike', 'public_transit', 'walk'];
    const validEnergy = ['renewable', 'mixed', 'coal'];
    const validShopping = ['minimal', 'average', 'frequent'];

    if (!validDiet.includes(diet)) {
      return res.status(400).json({ error: 'Invalid diet type' });
    }
    if (!validShopping.includes(shopping)) {
      return res.status(400).json({ error: 'Invalid shopping habit' });
    }
    if (!transport.mode || !validTransport.includes(transport.mode)) {
      return res.status(400).json({ error: 'Invalid transport mode' });
    }
    const weeklyKm = Number(transport.weeklyKm);
    if (isNaN(weeklyKm) || weeklyKm < 0 || weeklyKm > 10000) {
      return res.status(400).json({ error: 'Weekly distance must be a positive number under 10,000 km' });
    }
    if (!energy.source || !validEnergy.includes(energy.source)) {
      return res.status(400).json({ error: 'Invalid energy source' });
    }
    const monthlyKwh = Number(energy.monthlyKwh);
    if (isNaN(monthlyKwh) || monthlyKwh < 0 || monthlyKwh > 50000) {
      return res.status(400).json({ error: 'Monthly energy usage must be a positive number under 50,000 kWh' });
    }
    const shortHaul = Number(flights.shortHaul);
    const longHaul = Number(flights.longHaul);
    if (isNaN(shortHaul) || shortHaul < 0 || shortHaul > 365 || !Number.isInteger(shortHaul)) {
      return res.status(400).json({ error: 'Short-haul flights must be a positive integer under 365' });
    }
    if (isNaN(longHaul) || longHaul < 0 || longHaul > 365 || !Number.isInteger(longHaul)) {
      return res.status(400).json({ error: 'Long-haul flights must be a positive integer under 365' });
    }

    const answers = {
      transport: {
        mode: transport.mode || 'car_petrol',
        weeklyKm: Number(transport.weeklyKm) || 0
      },
      diet: diet,
      energy: {
        source: energy.source || 'mixed',
        monthlyKwh: Number(energy.monthlyKwh) || 0
      },
      shopping: shopping,
      flights: {
        shortHaul: Number(flights.shortHaul) || 0,
        longHaul: Number(flights.longHaul) || 0
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
