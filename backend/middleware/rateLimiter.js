const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development',
});

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});

// OTP request limiter
const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 2,
  message: 'Too many OTP requests, please wait before trying again.',
});

module.exports = {
  apiLimiter,
  authLimiter,
  otpLimiter,
};
