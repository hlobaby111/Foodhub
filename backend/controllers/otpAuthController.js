const User = require('../models/User');
const otpService = require('../services/otpService');
const tokenService = require('../services/tokenService');

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const CLEAR_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
};

class OTPAuthController {
  // Send OTP to phone number
  async sendOTP(req, res) {
    try {
      const { phone } = req.body;

      // Check rate limit
      const rateCheck = await otpService.checkRateLimit(phone);
      if (!rateCheck.allowed) {
        return res.status(429).json({
          message: rateCheck.message,
          waitSeconds: rateCheck.waitSeconds,
        });
      }

      // Generate OTP
      const otp = otpService.generateOTP();

      // Send OTP
      const result = await otpService.sendOTP(phone, otp);

      if (result.success) {
        return res.status(200).json({
          message: 'OTP sent successfully',
          phone: phone,
          // In development, return OTP for testing
          ...(process.env.NODE_ENV === 'development' && { otp }),
        });
      } else {
        return res.status(500).json({ message: 'Failed to send OTP' });
      }
    } catch (error) {
      console.error('Send OTP Error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Verify OTP and authenticate (login or register)
  async verifyOTPAndAuth(req, res) {
    try {
      const { phone, otp } = req.body;

      // Check failed attempts
      const failedCheck = await otpService.incrementFailedAttempts(phone);
      if (failedCheck.blocked) {
        return res.status(429).json({ message: failedCheck.message });
      }

      // Verify OTP
      const otpVerification = await otpService.verifyOTP(phone, otp);

      if (!otpVerification.valid) {
        return res.status(400).json({
          message: otpVerification.message,
          attemptsLeft: failedCheck.attemptsLeft,
        });
      }

      // OTP verified, clear failed attempts
      await otpService.clearFailedAttempts(phone);

      // Check if user exists
      let user = await User.findOne({ phone });
      let isNewUser = false;

      const { name, email, role: reqRole, isRegister } = req.body;

      if (!user) {
        // New user - create account
        const assignedRole = (isRegister && reqRole === 'restaurant_owner') ? 'restaurant_owner' : 'customer';
        user = new User({
          phone,
          name: name || undefined,
          email: email || undefined,
          role: assignedRole,
          isActive: true,
          isPhoneVerified: true,
        });
        await user.save();
        isNewUser = true;
      } else {
        // Existing user - update phone verification and optional profile fields
        user.isPhoneVerified = true;
        if (isRegister) {
          if (name) user.name = name;
          if (email) user.email = email;
          if (reqRole === 'restaurant_owner') user.role = 'restaurant_owner';
        }
        await user.save();
      }

      // Generate tokens
      const { accessToken, refreshToken } = tokenService.generateTokenPair(
        user._id.toString(),
        user.role
      );

      // Store refresh token
      await tokenService.storeRefreshToken(user._id.toString(), refreshToken);

      // Web flow: keep refresh token in secure httpOnly cookie.
      res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);
      // Ensure legacy access-token cookie does not interfere with header-based auth.
      res.clearCookie('access_token', CLEAR_COOKIE_OPTIONS);

      return res.status(200).json({
        message: isNewUser ? 'Account created successfully' : 'Login successful',
        isNewUser,
        needsProfile: !user.name || !user.email, // Check if profile needs completion
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          phone: user.phone,
          name: user.name,
          email: user.email,
          role: user.role,
          isPhoneVerified: user.isPhoneVerified,
        },
      });
    } catch (error) {
      console.error('Verify OTP Error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Refresh access token
  async refreshAccessToken(req, res) {
    try {
      const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;

      if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token required' });
      }

      // Rotate refresh token
      const tokens = await tokenService.rotateRefreshToken(refreshToken);

      // Store new refresh token
      const decoded = await tokenService.verifyRefreshToken(tokens.refreshToken);
      await tokenService.storeRefreshToken(decoded.userId, tokens.refreshToken);

      // Rotate refresh cookie for web clients.
      res.cookie('refresh_token', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
      // Keep access token memory/header-based for web clients.
      res.clearCookie('access_token', CLEAR_COOKIE_OPTIONS);

      return res.status(200).json({
        message: 'Token refreshed successfully',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (error) {
      console.error('Refresh Token Error:', error);
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
  }

  // Logout
  async logout(req, res) {
    try {
      const token =
        req.cookies?.access_token ||
        req.headers.authorization?.replace('Bearer ', '');
      const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;

      // Blacklist the current access token for its remaining lifetime
      if (token) {
        await tokenService.blacklistToken(token, 900); // 15 minutes
      }

      // Remove only this device's refresh token (other devices stay logged in)
      await tokenService.removeRefreshToken(req.userId, refreshToken);

      // Clear web refresh cookie
      res.clearCookie('access_token', CLEAR_COOKIE_OPTIONS);
      res.clearCookie('refresh_token', CLEAR_COOKIE_OPTIONS);

      return res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout Error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Get current user
  async getCurrentUser(req, res) {
    try {
      const user = await User.findById(req.userId).select('-password');
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.status(200).json({ user });
    } catch (error) {
      console.error('Get Current User Error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}

module.exports = new OTPAuthController();
