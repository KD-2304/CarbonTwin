const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Action = require('../models/Action');

const router = express.Router();

// Lightweight in-memory cache
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes cache
const cache = {
  stats: null,
  statsExpiry: 0,
  leaderboard: null,
  leaderboardExpiry: 0
};

// GET /api/community/stats
router.get('/stats', auth, async (req, res) => {
  try {
    const now = Date.now();
    if (cache.stats && cache.statsExpiry > now) {
      return res.json(cache.stats);
    }

    const statsResult = await User.aggregate([
      { $match: { onboardingComplete: true } },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          totalScore: { $sum: '$currentScore' },
          totalBaseline: { $sum: '$baselineScore' },
          weeklyScoreSum: { $sum: { $ifNull: ['$weeklyScore', 0] } }
        }
      }
    ]);

    if (statsResult.length === 0) {
      return res.json({
        totalUsers: 0,
        communityAverage: 4000,
        totalCO2Saved: 0,
        weeklyCO2Saved: 0,
        cityHealth: 50
      });
    }

    const { totalUsers, totalScore, totalBaseline, weeklyScoreSum } = statsResult[0];
    const communityAverage = Math.round(totalScore / totalUsers);

    // Calculate total CO₂ saved vs baseline
    const totalCO2Saved = Math.round(totalBaseline - totalScore);

    // Weekly CO₂ saved by all users
    const weeklyCO2Saved = Math.round(weeklyScoreSum);

    // City health: 0-100 scale
    // 100 = community avg at Paris target (2000kg), 0 = at 8000kg+
    const cityHealth = Math.max(0, Math.min(100, Math.round(100 - ((communityAverage - 2000) / 60))));

    const responsePayload = {
      totalUsers,
      communityAverage,
      totalCO2Saved: Math.max(0, totalCO2Saved),
      weeklyCO2Saved: Math.abs(weeklyCO2Saved),
      cityHealth
    };

    cache.stats = responsePayload;
    cache.statsExpiry = now + CACHE_TTL;

    res.json(responsePayload);
  } catch (error) {
    console.error('Community stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/community/leaderboard
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const now = Date.now();
    let leaderboardData = null;

    if (cache.leaderboard && cache.leaderboardExpiry > now) {
      leaderboardData = cache.leaderboard;
    } else {
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

      const totalUsers = await User.countDocuments({ onboardingComplete: true });

      leaderboardData = {
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
        totalUsers
      };

      cache.leaderboard = leaderboardData;
      cache.leaderboardExpiry = now + CACHE_TTL;
    }

    // Get requesting user's rank (live query, O(log N) index scan)
    const currentUser = await User.findById(req.userId);
    let userRank = 0;

    if (currentUser && currentUser.onboardingComplete) {
      userRank = await User.countDocuments({
        onboardingComplete: true,
        weeklyScore: { $lt: currentUser.weeklyScore || 0 }
      }) + 1;
    }

    res.json({
      ...leaderboardData,
      userRank
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
