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

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2 || name.length > 50) {
        return res.status(400).json({ error: 'Name must be between 2 and 50 characters' });
      }
    }
    if (city !== undefined) {
      if (typeof city !== 'string' || city.length > 100) {
        return res.status(400).json({ error: 'City name must be under 100 characters' });
      }
    }
    if (country !== undefined) {
      if (typeof country !== 'string' || country.length > 100) {
        return res.status(400).json({ error: 'Country name must be under 100 characters' });
      }
    }

    const updates = {};
    if (name) updates.name = name.trim();
    if (city !== undefined) updates.city = city.trim();
    if (country !== undefined) updates.country = country.trim();

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

const Action = require('../models/Action');

// GET /api/user/dashboard-summary
router.get('/dashboard-summary', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Lazy Reset Check
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

    const userProfile = {
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
    };

    // 1. Fetch action history (last 30 days)
    const historySince = new Date();
    historySince.setDate(historySince.getDate() - 30);
    const historyActions = await Action.find({
      userId: req.userId,
      timestamp: { $gte: historySince }
    }).sort({ timestamp: -1 }).limit(200);

    // 2. Fetch weekly summary (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyActions = await Action.find({
      userId: req.userId,
      timestamp: { $gte: weekAgo }
    });

    const summary = {
      totalActions: weeklyActions.length,
      totalDelta: weeklyActions.reduce((sum, a) => sum + a.co2Delta, 0),
      byCategory: {}
    };

    weeklyActions.forEach(a => {
      if (!summary.byCategory[a.category]) {
        summary.byCategory[a.category] = { count: 0, delta: 0 };
      }
      summary.byCategory[a.category].count++;
      summary.byCategory[a.category].delta += a.co2Delta;
    });

    res.json({
      profile: userProfile,
      history: historyActions,
      summary: summary
    });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
