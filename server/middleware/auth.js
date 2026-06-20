const jwt = require('jsonwebtoken');
const { parseCookies } = require('../utils/cookieHelper');
const BlacklistedToken = require('../models/BlacklistedToken');

const auth = async (req, res, next) => {
  try {
    let token = null;

    // 1. Try reading from cookie
    if (req.headers.cookie) {
      const cookies = parseCookies(req.headers.cookie);
      token = cookies.ctc_token;
    }

    // 2. Fallback to Authorization header
    if (!token) {
      const authHeader = req.header('Authorization');
      if (authHeader) {
        token = authHeader.replace('Bearer ', '');
      }
    }

    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token is blacklisted (revoked session)
    const isBlacklisted = await BlacklistedToken.findOne({ token });
    if (isBlacklisted) {
      return res.status(401).json({ error: 'Session has been revoked' });
    }
    req.userId = decoded.userId;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    res.status(401).json({ error: 'Invalid authentication token' });
  }
};

module.exports = auth;
