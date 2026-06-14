const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const { getStreakStatus } = require('../services/scoreService');

const router = express.Router();

// Helper to get start of the week (Monday 00:00:00)
function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  // Get days to subtract to reach Monday (1). Sunday (0) -> subtract 6 days.
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// GET /api/user/profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Lazy Reset Check: Ensure weeklyScore is reset if transitioning to a new calendar week
    const now = new Date();
    const lastReset = user.lastWeeklyReset || user.createdAt || now;
    const startOfCurrentWeek = getStartOfWeek(now);
    const startOfLastResetWeek = getStartOfWeek(lastReset);

    if (startOfCurrentWeek.getTime() > startOfLastResetWeek.getTime()) {
      user.weeklyScore = 0;
      user.lastWeeklyReset = now;
      await user.save();
    }

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
