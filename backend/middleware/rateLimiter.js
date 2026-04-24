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
  handler: (req, res, _next, options) => {
    const resetTime = req.rateLimit?.resetTime ? new Date(req.rateLimit.resetTime).getTime() : null;
    const fallbackMs = typeof options.windowMs === 'number' ? options.windowMs : 60 * 1000;
    const waitMs = resetTime ? Math.max(resetTime - Date.now(), 0) : fallbackMs;
    const waitSeconds = Math.max(Math.ceil(waitMs / 1000), 1);

    return res.status(options.statusCode).json({
      message: `Too many OTP requests. Try again after ${waitSeconds} seconds.`,
      waitSeconds,
    });
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  otpLimiter,
};
