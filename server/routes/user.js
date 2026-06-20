const express = require('express');
const { z } = require('zod');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const User = require('../models/User');
const { getStreakStatus } = require('../services/scoreService');
const { checkAndResetWeeklyScore } = require('../utils/dateHelpers');
const { parseCookies } = require('../utils/cookieHelper');

const router = express.Router();

// GET /api/user/profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });



    const streakStatus = getStreakStatus(user.lastLogDate, user.streak);

    let csrfToken = null;
    if (req.headers.cookie) {
      const cookies = parseCookies(req.headers.cookie);
      csrfToken = cookies.ctc_csrf_token;
    }

    if (!csrfToken) {
      csrfToken = crypto.randomBytes(24).toString('hex');
      res.cookie('ctc_csrf_token', csrfToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
    }

    res.json({
      csrfToken,
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
      targetGoal: user.targetGoal,
      streakStatus,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

const profileUpdateSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Name must be between 2 and 50 characters')
    .max(50, 'Name must be between 2 and 50 characters')
    .optional(),
  city: z.string().max(100, 'City name must be under 100 characters').optional().or(z.literal('')),
  country: z.string().max(100, 'Country name must be under 100 characters').optional().or(z.literal(''))
});

// PUT /api/user/profile
router.put('/profile', auth, async (req, res) => {
  try {
    const result = profileUpdateSchema.safeParse(req.body);
    if (!result.success) {
      const errorMsg = result.error.issues[0].message;
      return res.status(400).json({ error: errorMsg });
    }

    const { name, city, country } = result.data;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (city !== undefined) updates.city = city.trim();
    if (country !== undefined) updates.country = country.trim();

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true, runValidators: true });
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
      targetGoal: user.targetGoal,
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

    let csrfToken = null;
    if (req.headers.cookie) {
      const cookies = parseCookies(req.headers.cookie);
      csrfToken = cookies.ctc_csrf_token;
    }

    if (!csrfToken) {
      csrfToken = crypto.randomBytes(24).toString('hex');
      res.cookie('ctc_csrf_token', csrfToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
    }

    res.json({
      csrfToken,
      profile: userProfile,
      history: historyActions,
      summary: summary
    });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/user/goal
router.put('/goal', auth, async (req, res) => {
  try {
    const { targetGoal } = req.body;

    if (targetGoal === undefined || targetGoal === null) {
      return res.status(400).json({ error: 'Target goal is required' });
    }

    const goal = Number(targetGoal);
    if (isNaN(goal) || goal < 0 || goal > 50000) {
      return res.status(400).json({ error: 'Target goal must be a number between 0 and 50,000 kg' });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { targetGoal: Math.round(goal) },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      targetGoal: user.targetGoal,
      currentScore: user.currentScore,
      baselineScore: user.baselineScore
    });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
