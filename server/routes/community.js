const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Action = require('../models/Action');

const router = express.Router();

// GET /api/community/stats
router.get('/stats', auth, async (req, res) => {
  try {
    const users = await User.find({ onboardingComplete: true });
    const totalUsers = users.length;

    if (totalUsers === 0) {
      return res.json({
        totalUsers: 0,
        communityAverage: 4000,
        totalCO2Saved: 0,
        weeklyCO2Saved: 0,
        cityHealth: 50
      });
    }

    const totalScore = users.reduce((sum, u) => sum + u.currentScore, 0);
    const communityAverage = Math.round(totalScore / totalUsers);

    // Calculate total CO₂ saved vs baseline
    const totalBaseline = users.reduce((sum, u) => sum + u.baselineScore, 0);
    const totalCO2Saved = Math.round(totalBaseline - totalScore);

    // Weekly CO₂ saved by all users
    const weeklyCO2Saved = Math.round(users.reduce((sum, u) => sum + (u.weeklyScore || 0), 0));

    // City health: 0-100 scale
    // 100 = community avg at Paris target (2000kg), 0 = at 8000kg+
    const cityHealth = Math.max(0, Math.min(100, Math.round(100 - ((communityAverage - 2000) / 60))));

    res.json({
      totalUsers,
      communityAverage,
      totalCO2Saved: Math.max(0, totalCO2Saved),
      weeklyCO2Saved: Math.abs(weeklyCO2Saved),
      cityHealth
    });
  } catch (error) {
    console.error('Community stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/community/leaderboard
router.get('/leaderboard', auth, async (req, res) => {
  try {
    // Top users by most CO₂ reduced this week (most negative weeklyScore)
    const topReducers = await User.find({ onboardingComplete: true })
      .sort({ weeklyScore: 1 })
      .limit(10)
      .select('name currentScore weeklyScore streak');

    // Top users by longest streak
    const topStreaks = await User.find({ onboardingComplete: true })
      .sort({ streak: -1 })
      .limit(10)
      .select('name currentScore weeklyScore streak');

    // Get requesting user's rank
    const currentUser = await User.findById(req.userId);
    const allUsers = await User.find({ onboardingComplete: true })
      .sort({ weeklyScore: 1 })
      .select('_id');

    const userRank = allUsers.findIndex(u => u._id.toString() === req.userId) + 1;

    res.json({
      topReducers: topReducers.map(u => ({
        id: u._id,
        name: u.name,
        currentScore: u.currentScore,
        weeklyDelta: u.weeklyScore || 0,
        streak: u.streak
      })),
      topStreaks: topStreaks.map(u => ({
        id: u._id,
        name: u.name,
        currentScore: u.currentScore,
        weeklyDelta: u.weeklyScore || 0,
        streak: u.streak
      })),
      userRank,
      totalUsers: allUsers.length
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
