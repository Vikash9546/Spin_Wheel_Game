const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');
const prisma = require('../db/prisma');

/**
 * Standard JWT Authentication Middleware.
 * Expects Bearer token in the Authorization header.
 */
async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && (authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader);

  if (!token) {
    return res.status(401).json({ error: 'Access token missing' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    
    // Check if user still exists in the database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'User account no longer exists' });
    }
    
    req.user = decoded; // Attach user info (id, name, role)
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    console.error('🔒 [AuthMiddleware] Verification error:', err.message);
    return res.status(500).json({ error: 'Internal authorization error' });
  }
}

module.exports = authMiddleware;

