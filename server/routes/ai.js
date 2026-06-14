const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Action = require('../models/Action');
const WeeklyReport = require('../models/WeeklyReport');
const { generateWeeklyInsight, handleChatMessage, generateWeeklyReport } = require('../services/aiService');

const router = express.Router();

// Helper: get user data for AI context
async function getUserDataForAI(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const recentActions = await Action.find({
    userId,
    timestamp: { $gte: weekAgo }
  }).sort({ timestamp: -1 }).limit(50);

  // Find weakest category (highest emissions)
  const breakdown = user.scoreBreakdown || {};
  const weakestCategory = Object.entries(breakdown)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'transport';

  return {
    currentScore: user.currentScore,
    baselineScore: user.baselineScore,
    scoreBreakdown: breakdown,
    recentActions: recentActions.map(a => ({
      timestamp: a.timestamp.toISOString().split('T')[0],
      category: a.category,
      action: a.action,
      co2Delta: a.co2Delta
    })),
    weakestCategory,
    streak: user.streak
  };
}

// POST /api/ai/weekly-insight
router.post('/weekly-insight', auth, async (req, res) => {
  try {
    const userData = await getUserDataForAI(req.userId);
    const insight = await generateWeeklyInsight(userData);
    res.json(insight);
  } catch (error) {
    console.error('Weekly insight error:', error);
    res.status(500).json({ error: 'Failed to generate insight' });
  }
});

// POST /api/ai/chat
router.post('/chat', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const userData = await getUserDataForAI(req.userId);
    const result = await handleChatMessage(message, userData);
    res.json(result);
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// POST /api/ai/weekly-report
router.post('/weekly-report', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Get this week's start (Monday)
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    weekStart.setHours(0, 0, 0, 0);

    // Check if report already exists for this week
    const existingReport = await WeeklyReport.findOne({
      userId: req.userId,
      weekStart: { $gte: weekStart }
    });

    if (existingReport) {
      return res.json(existingReport);
    }

    // Get week's actions
    const weekActions = await Action.find({
      userId: req.userId,
      timestamp: { $gte: weekStart }
    });

    const totalDelta = weekActions.reduce((sum, a) => sum + a.co2Delta, 0);
    const categoryTotals = {};
    weekActions.forEach(a => {
      categoryTotals[a.category] = (categoryTotals[a.category] || 0) + a.co2Delta;
    });

    // Create report document immediately with a generating placeholder status
    const report = new WeeklyReport({
      userId: req.userId,
      weekStart,
      summary: 'Generating...', // Special sentinel for frontend loading states
      insight: 'Analyzing your habits...',
      goal: 'Calculating goals...',
      totalDelta,
      actionsCount: weekActions.length,
      categoryBreakdown: categoryTotals
    });
    await report.save();

    // Trigger AI compilation in the background asynchronously
    setImmediate(async () => {
      try {
        const userData = await getUserDataForAI(req.userId);
        const reportData = await generateWeeklyReport(userData, weekActions);
        
        await WeeklyReport.findByIdAndUpdate(report._id, {
          summary: reportData.summary || `Logged ${weekActions.length} actions this week.`,
          insight: reportData.insight || '',
          goal: reportData.goal || '',
        });
      } catch (err) {
        console.error('Background weekly report AI generation failed:', err);
        await WeeklyReport.findByIdAndUpdate(report._id, {
          summary: `This week you logged ${weekActions.length} actions with a net impact of ${totalDelta.toFixed(1)} kg CO₂.`,
          insight: 'AI insight currently unavailable.',
          goal: 'Keep logging your daily actions to track progress.'
        });
      }
    });

    res.status(202).json(report);
  } catch (error) {
    console.error('Weekly report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// GET /api/ai/reports — list all weekly reports for user
router.get('/reports', auth, async (req, res) => {
  try {
    const reports = await WeeklyReport.find({ userId: req.userId })
      .sort({ weekStart: -1 })
      .limit(52);
    res.json(reports);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
