const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const { calculateBaselineScore } = require('../services/scoreService');

const router = express.Router();

// POST /api/quiz/submit
router.post('/submit', auth, async (req, res) => {
  try {
    const { transport, diet, energy, shopping, flights } = req.body;

    // Validate required fields
    if (!transport || !diet || !energy || !shopping || !flights) {
      return res.status(400).json({ error: 'All quiz fields are required' });
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
