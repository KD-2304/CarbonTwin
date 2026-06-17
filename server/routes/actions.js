const express = require('express');
const auth = require('../middleware/auth');
const Action = require('../models/Action');
const User = require('../models/User');
const { calculateActionDelta, updateStreak } = require('../services/scoreService');

const router = express.Router();

const { z } = require('zod');

const validActions = {
  transport: ['took_car', 'public_transit', 'cycled_walked', 'work_from_home'],
  meal: ['vegan_meal', 'vegetarian_meal', 'meat_meal', 'local_produce'],
  home: ['ac_off_4hrs', 'air_dry_laundry', 'reduced_heating'],
  shopping: ['secondhand_item', 'avoid_plastic', 'new_electronics']
};

const actionLogSchema = z.object({
  category: z.string({ message: 'Category is required' }).refine(val => {
    return ['transport', 'meal', 'home', 'shopping'].includes(val);
  }, {
    message: 'Invalid action category'
  }),
  action: z.string({ message: 'Action is required' }),
  notes: z.string().max(500, 'Notes must be under 500 characters').optional().or(z.literal('')),
  km: z.coerce.number().optional()
}).refine(data => {
  const allowed = validActions[data.category];
  return allowed && allowed.includes(data.action);
}, {
  message: 'Invalid action for category',
  path: ['action']
}).refine(data => {
  if (data.category === 'transport' && (data.action === 'took_car' || data.action === 'cycled_walked')) {
    const km = data.km;
    return km !== undefined && !isNaN(km) && km >= 0 && km <= 1000;
  }
  return true;
}, {
  message: 'Distance must be a positive number under 1,000 km',
  path: ['km']
});

const validateActionLog = (req, res, next) => {
  const result = actionLogSchema.safeParse(req.body);
  if (!result.success) {
    const errorMsg = result.error.issues[0].message;
    return res.status(400).json({ error: errorMsg });
  }

  req.body = result.data;
  next();
};

// POST /api/actions/log
router.post('/log', auth, validateActionLog, async (req, res) => {
  try {
    const { category, action, notes, km } = req.body;

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Calculate CO₂ delta
    const co2Delta = calculateActionDelta(category, action, km || 0, user.quizAnswers);

    // Create action log
    const actionLog = new Action({
      userId: req.userId,
      category,
      action,
      co2Delta,
      notes: notes || '',
      timestamp: new Date()
    });
    await actionLog.save();

    // Update user score by adding the daily action's CO2 delta directly
    user.currentScore = Math.max(0, user.currentScore + co2Delta);
    user.weeklyScore = (user.weeklyScore || 0) + co2Delta;

    // Update streak
    const { streak } = updateStreak(user.lastLogDate, user.streak);
    user.streak = streak;
    user.lastLogDate = new Date();

    // Daily snapshot
    user.addDailySnapshot(user.currentScore);
    await user.save();

    // Build inline weekly summary so client doesn't need a second round-trip
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
      action: {
        id: actionLog._id,
        category: actionLog.category,
        action: actionLog.action,
        co2Delta: actionLog.co2Delta,
        timestamp: actionLog.timestamp
      },
      updatedScore: user.currentScore,
      streak: user.streak,
      weeklyScore: user.weeklyScore,
      // Enriched profile for client-side state sync (avoids extra API calls)
      updatedProfile: {
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
        createdAt: user.createdAt
      },
      summary
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    console.error('Log action error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/actions/history?days=7
router.get('/history', auth, async (req, res) => {
  try {
    let days = parseInt(req.query.days);
    if (isNaN(days) || days <= 0 || days > 365) {
      days = 7;
    }
    const since = new Date();
    since.setDate(since.getDate() - days);

    const actions = await Action.find({
      userId: req.userId,
      timestamp: { $gte: since }
    }).sort({ timestamp: -1 }).limit(200);

    res.json(actions);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/actions/summary
router.get('/summary', auth, async (req, res) => {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const actions = await Action.find({
      userId: req.userId,
      timestamp: { $gte: weekAgo }
    });

    const summary = {
      totalActions: actions.length,
      totalDelta: actions.reduce((sum, a) => sum + a.co2Delta, 0),
      byCategory: {}
    };

    actions.forEach(a => {
      if (!summary.byCategory[a.category]) {
        summary.byCategory[a.category] = { count: 0, delta: 0 };
      }
      summary.byCategory[a.category].count++;
      summary.byCategory[a.category].delta += a.co2Delta;
    });

    res.json(summary);
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
