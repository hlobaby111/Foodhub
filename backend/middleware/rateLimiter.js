const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});

// OTP request limiter
const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 2, // 2 OTP requests per minute
  message: 'Too many OTP requests, please wait before trying again.',
});

module.exports = {
  apiLimiter,
  authLimiter,
  otpLimiter,
};
