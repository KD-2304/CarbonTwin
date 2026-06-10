const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  city: {
    type: String,
    trim: true,
    default: ''
  },
  country: {
    type: String,
    trim: true,
    default: ''
  },
  baselineScore: {
    type: Number,
    default: 0
  },
  currentScore: {
    type: Number,
    default: 0
  },
  weeklyScore: {
    type: Number,
    default: 0
  },
  streak: {
    type: Number,
    default: 0
  },
  lastLogDate: {
    type: Date,
    default: null
  },
  onboardingComplete: {
    type: Boolean,
    default: false
  },
  quizAnswers: {
    transport: {
      mode: { type: String, enum: ['car_petrol', 'car_diesel', 'car_electric', 'bike', 'public_transit', 'walk'], default: 'car_petrol' },
      weeklyKm: { type: Number, default: 0 }
    },
    diet: {
      type: String,
      enum: ['vegan', 'vegetarian', 'pescatarian', 'omnivore', 'heavy_meat'],
      default: 'omnivore'
    },
    energy: {
      source: { type: String, enum: ['renewable', 'mixed', 'coal'], default: 'mixed' },
      monthlyKwh: { type: Number, default: 0 }
    },
    shopping: {
      type: String,
      enum: ['minimal', 'average', 'frequent'],
      default: 'average'
    },
    flights: {
      shortHaul: { type: Number, default: 0 },
      longHaul: { type: Number, default: 0 }
    }
  },
  scoreBreakdown: {
    transport: { type: Number, default: 0 },
    diet: { type: Number, default: 0 },
    energy: { type: Number, default: 0 },
    shopping: { type: Number, default: 0 },
    flights: { type: Number, default: 0 }
  },
  dailySnapshots: [{
    date: { type: Date },
    score: { type: Number }
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Trim daily snapshots to last 90 days
userSchema.methods.addDailySnapshot = function(score) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if we already have a snapshot for today
  const existingIndex = this.dailySnapshots.findIndex(s => {
    const snapDate = new Date(s.date);
    snapDate.setHours(0, 0, 0, 0);
    return snapDate.getTime() === today.getTime();
  });

  if (existingIndex >= 0) {
    this.dailySnapshots[existingIndex].score = score;
  } else {
    this.dailySnapshots.push({ date: today, score });
  }

  // Keep only last 90 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  this.dailySnapshots = this.dailySnapshots.filter(s => new Date(s.date) >= cutoff);
};

module.exports = mongoose.model('User', userSchema);
