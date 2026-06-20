const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    expires: 0 // MongoDB TTL index: documents are removed when the current time is past expiresAt
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
