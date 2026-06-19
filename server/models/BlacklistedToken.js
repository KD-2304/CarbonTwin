const mongoose = require('mongoose');

const blacklistedTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 30 * 24 * 60 * 60 // 30 days (2,592,000 seconds) TTL index
  }
});

module.exports = mongoose.model('BlacklistedToken', blacklistedTokenSchema);
