const express = require('express');
const { body } = require('express-validator');
const otpController = require('../controllers/otpAuthController');
const validate = require('../middleware/validator');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Send OTP to phone number
router.post(
  '/send-otp',
  otpLimiter,
  [
    body('phone')
      .isMobilePhone('en-IN')
      .withMessage('Please provide a valid Indian phone number'),
    validate,
  ],
  otpController.sendOTP
);

// Verify OTP and login/register
router.post(
  '/verify-otp',
  authLimiter,
  [
    body('phone')
      .isMobilePhone('en-IN')
      .withMessage('Please provide a valid phone number'),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits'),
    validate,
  ],
  otpController.verifyOTPAndAuth
);

// Refresh access token (from httpOnly cookie for web, or request body for mobile)
router.post('/refresh-token', otpController.refreshAccessToken);

// Logout
router.post('/logout', authMiddleware, otpController.logout);

// Get current user
router.get('/me', authMiddleware, otpController.getCurrentUser);

module.exports = router;
