const mongoose = require('mongoose');

const weeklyReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  weekStart: {
    type: Date,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  insight: {
    type: String,
    default: ''
  },
  goal: {
    type: String,
    default: ''
  },
  categoryBreakdown: {
    transport: { type: Number, default: 0 },
    meal: { type: Number, default: 0 },
    home: { type: Number, default: 0 },
    shopping: { type: Number, default: 0 }
  },
  totalDelta: {
    type: Number,
    default: 0
  },
  actionsCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

weeklyReportSchema.index({ userId: 1, weekStart: -1 });

module.exports = mongoose.model('WeeklyReport', weeklyReportSchema);
