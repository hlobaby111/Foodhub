const tokenService = require('../services/tokenService');
const User = require('../models/User');

// Middleware to verify access token
// Priority: Authorization header (memory token) -> httpOnly cookie (fallback)
const authMiddleware = async (req, res, next) => {
  try {
    const token =
      req.headers.authorization?.replace('Bearer ', '') ||
      req.cookies?.access_token;

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = await tokenService.verifyAccessToken(token);
    
    // Fetch user from database
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    req.user = user;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ message: error.message });
  }
};

// Middleware to check specific roles
const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'You do not have permission to access this resource' 
      });
    }

    next();
  };
};

// Optional auth middleware (doesn't throw error if no token)
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const token =
      req.headers.authorization?.replace('Bearer ', '') ||
      req.cookies?.access_token;

    if (token) {
      const decoded = await tokenService.verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select('-password');
      if (user && user.isActive) {
        req.user = user;
        req.userId = decoded.userId;
      }
    }
  } catch (error) {
    // Silently fail, request continues without user
  }
  next();
};

module.exports = {
  authMiddleware,
  roleMiddleware,
  optionalAuthMiddleware,
};
