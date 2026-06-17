const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    let token = null;

    // 1. Try reading from cookie
    if (req.headers.cookie) {
      const cookies = req.headers.cookie.split(';').reduce((acc, c) => {
        const eqIdx = c.indexOf('=');
        if (eqIdx !== -1) {
          const key = c.slice(0, eqIdx).trim();
          const val = c.slice(eqIdx + 1).trim();
          if (key) acc[key] = decodeURIComponent(val);
        }
        return acc;
      }, {});
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
    req.userId = decoded.userId;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired, please login again' });
    }
    res.status(401).json({ error: 'Invalid authentication token' });
  }
};

module.exports = auth;
