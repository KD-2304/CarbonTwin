const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const User = require('../models/User');

const router = express.Router();

// Strict rate limiter for login to prevent brute-force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many login attempts, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Only count failed attempts
});

// Rate limiter for registration to prevent spam account creation
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 attempts per hour
  message: { error: 'Too many registration attempts from this IP, please try again after an hour.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Input Validation Schemas
const registerSchema = z.object({
  name: z.string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name is required and must be between 2 and 50 characters')
    .max(50, 'Name is required and must be between 2 and 50 characters'),
  email: z.string({ required_error: 'Email is required' })
    .trim()
    .email('Email is required and must be a valid email address'),
  password: z.string({ required_error: 'Password is required' })
    .min(8, 'Password is required and must be at least 8 characters')
    .max(100, 'Password is required and must be under 100 characters'),
  city: z.string().max(100, 'City name is too long').optional().or(z.literal('')),
  country: z.string().max(100, 'Country name is too long').optional().or(z.literal(''))
});

const loginSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).trim(),
  password: z.string({ required_error: 'Password is required' })
    .max(100, 'Password must be under 100 characters')
});

const validateRegisterInput = (req, res, next) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    const errorMsg = result.error.issues[0].message;
    return res.status(400).json({ error: errorMsg });
  }
  req.body = result.data;
  next();
};

const validateLoginInput = (req, res, next) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    const errorMsg = result.error.issues[0].message;
    return res.status(400).json({ error: errorMsg });
  }
  req.body = result.data;
  next();
};

// POST /api/auth/register
router.post('/register', registerLimiter, validateRegisterInput, async (req, res) => {
  try {
    const { name, email, password, city, country } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const user = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      city: (city || '').trim(),
      country: (country || '').trim()
    });
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    const csrfToken = crypto.randomBytes(24).toString('hex');

    // Set HttpOnly cookie
    res.cookie('ctc_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    // Set non-HttpOnly CSRF cookie for client-side access
    res.cookie('ctc_csrf_token', csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        city: user.city,
        country: user.country,
        onboardingComplete: user.onboardingComplete
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', loginLimiter, validateLoginInput, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    const csrfToken = crypto.randomBytes(24).toString('hex');

    // Set HttpOnly cookie
    res.cookie('ctc_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    // Set non-HttpOnly CSRF cookie for client-side access
    res.cookie('ctc_csrf_token', csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        city: user.city,
        country: user.country,
        onboardingComplete: user.onboardingComplete,
        currentScore: user.currentScore,
        streak: user.streak
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('ctc_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
  });
  res.clearCookie('ctc_csrf_token', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
  });
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;

