const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

/**
 * Standard JWT Authentication Middleware.
 * Expects Bearer token in the Authorization header.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && (authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader);

  if (!token) {
    return res.status(401).json({ error: 'Access token missing' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded; // Attach user info (id, name, role)
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;
