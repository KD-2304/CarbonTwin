const express = require('express');
const auth = require('../middleware/auth');
const Action = require('../models/Action');
const User = require('../models/User');
const { calculateActionDelta, updateStreak } = require('../services/scoreService');

const router = express.Router();

// POST /api/actions/log
router.post('/log', auth, async (req, res) => {
  try {
    const { category, action, notes, km } = req.body;

    if (!category || !action) {
      return res.status(400).json({ error: 'Category and action are required' });
    }

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

    // Update user score
    // Convert daily delta to annual impact (multiply by 365)
    // But we store the running impact, not annualized
    user.currentScore = Math.max(0, user.currentScore + (co2Delta * 365 / 365));
    user.weeklyScore = (user.weeklyScore || 0) + co2Delta;

    // Update streak
    const { streak } = updateStreak(user.lastLogDate, user.streak);
    user.streak = streak;
    user.lastLogDate = new Date();

    // Daily snapshot
    user.addDailySnapshot(user.currentScore);
    await user.save();

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
      weeklyScore: user.weeklyScore
    });
  } catch (error) {
    console.error('Log action error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/actions/history?days=7
router.get('/history', auth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
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
