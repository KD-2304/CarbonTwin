const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const { getStreakStatus } = require('../services/scoreService');

const router = express.Router();

// GET /api/user/profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const streakStatus = getStreakStatus(user.lastLogDate, user.streak);

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      city: user.city,
      country: user.country,
      baselineScore: user.baselineScore,
      currentScore: user.currentScore,
      weeklyScore: user.weeklyScore,
      streak: user.streak,
      lastLogDate: user.lastLogDate,
      onboardingComplete: user.onboardingComplete,
      quizAnswers: user.quizAnswers,
      scoreBreakdown: user.scoreBreakdown,
      dailySnapshots: user.dailySnapshots,
      streakStatus,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/user/profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, city, country } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (city !== undefined) updates.city = city;
    if (country !== undefined) updates.country = country;

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      city: user.city,
      country: user.country
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/user/score
router.get('/score', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      baselineScore: user.baselineScore,
      currentScore: user.currentScore,
      weeklyScore: user.weeklyScore,
      scoreBreakdown: user.scoreBreakdown,
      streak: user.streak,
      dailySnapshots: user.dailySnapshots.slice(-30)
    });
  } catch (error) {
    console.error('Get score error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
