const logger = require('../utils/logger');

/**
 * Centralized Error Handler Middleware
 * 
 * Catches and normalizes errors from all routes into consistent JSON responses.
 * Handles Mongoose ValidationError, Zod parse errors, CORS errors, and generic errors.
 */

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Already sent a response — do nothing
  if (res.headersSent) {
    return next(err);
  }

  // ─── Mongoose ValidationError ────────────────────────
  if (err.name === 'ValidationError' && err.errors) {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: messages.join(', ') });
  }

  // ─── Zod Validation Error ───────────────────────────
  if (err.name === 'ZodError' || err.issues) {
    const message = err.issues?.[0]?.message || 'Validation failed';
    return res.status(400).json({ error: message });
  }

  // ─── CORS Error ─────────────────────────────────────
  if (err.message && err.message.includes('Not allowed by CORS')) {
    return res.status(403).json({ error: 'CORS: Origin not allowed' });
  }

  // ─── JWT Errors ─────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired, please login again' });
  }

  // ─── Mongoose CastError (invalid ObjectId, etc.) ────
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid identifier format' });
  }

  // ─── Generic Error ──────────────────────────────────
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;

  if (statusCode === 500) {
    logger.error('Unhandled error:', err);
  }

  res.status(statusCode).json({ error: message });
};

module.exports = errorHandler;
