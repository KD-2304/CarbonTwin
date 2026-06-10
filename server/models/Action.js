const mongoose = require('mongoose');

const actionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: ['transport', 'meal', 'home', 'shopping']
  },
  action: {
    type: String,
    required: true
  },
  co2Delta: {
    type: Number,
    required: true
  },
  notes: {
    type: String,
    default: '',
    maxlength: 500
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index for efficient user+time queries
actionSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('Action', actionSchema);
