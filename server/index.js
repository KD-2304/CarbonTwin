require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const { parseCookies } = require('./utils/cookieHelper');
const env = require('./config/env');
const logger = require('./utils/logger');


const app = express();

// Trust reverse proxy (e.g. Nginx on EC2) in production for correct client IP tracking and cookie security
if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ─── CORS CONFIGURATION ────────────────────────────────────────
const allowedOrigins = env.CLIENT_URL
  ? env.CLIENT_URL.split(',').map(url => url.trim().replace(/\/$/, ''))
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, tools, or same-origin)
    if (!origin) {
      return callback(null, true);
    }

    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        // Convert wildcard pattern (e.g. https://*.vercel.app) to regex
        const regexStr = '^' + allowed
          .replace(/[.+^${}()|[\]\\]/g, '\\$&')
          .replace(/\*/g, '.*') + '$';
        const regex = new RegExp(regexStr);
        return regex.test(origin);
      }
      return origin === allowed;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS. Incoming origin: "${origin}" does not match configured origins: "${allowedOrigins.join(', ')}"`));
    }
  },
  credentials: true
}));


// ─── SECURITY MIDDLEWARE ──────────────────────────────────────
app.use(helmet());
app.use(mongoSanitize());

// Rate limiting for API protection
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: 'Too many requests, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', apiLimiter);

app.use(express.json({ limit: '10kb' }));

// Anti-CSRF validation middleware for mutating requests
app.use((req, res, next) => {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {


    // Exclude login, register and refresh routes from CSRF checks
    if (['/api/auth/login', '/api/auth/register', '/api/auth/refresh'].includes(req.path)) {
      return next();
    }

    let csrfCookie = null;
    if (req.headers.cookie) {
      const cookies = parseCookies(req.headers.cookie);
      csrfCookie = cookies.ctc_csrf_token;
    }

    const csrfHeader = req.headers['x-ctc-request'];

    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      return res.status(403).json({ error: 'CSRF Protection: Token mismatch or missing' });
    }
  }
  next();
});



// ─── ROUTES ───────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/actions', require('./routes/actions'));
app.use('/api/community', require('./routes/community'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/simulator', require('./routes/simulator'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Centralized error handler (must be registered after all routes)
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// ─── DATABASE + SERVER START ──────────────────────────────────
const PORT = env.PORT;
const MONGO_URI = env.MONGO_URI;

if (require.main === module) {
  // Start background cron jobs
  require('./services/cronService');

  mongoose.connect(MONGO_URI)
    .then(() => {
      logger.info('✅ Connected to MongoDB');
      app.listen(PORT, () => {
        logger.info(`🚀 Carbon Twin City API running on port ${PORT}`);
      });
    })
    .catch(err => {
      logger.error('❌ MongoDB connection error:', err);
      process.exit(1);
    });
}

module.exports = app;

