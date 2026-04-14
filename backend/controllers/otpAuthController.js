const User = require('../models/User');
const otpService = require('../services/otpService');
const tokenService = require('../services/tokenService');

class OTPAuthController {
  // Send OTP to phone number
  async sendOTP(req, res) {
    try {
      const { phone } = req.body;

      // Check rate limit
      const rateCheck = await otpService.checkRateLimit(phone);
      if (!rateCheck.allowed) {
        return res.status(429).json({ message: rateCheck.message });
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

      if (!user) {
        // New user - create account
        user = new User({
          phone,
          role: 'customer',
          isActive: true,
          isPhoneVerified: true,
        });
        await user.save();
        isNewUser = true;
      } else {
        // Existing user - update phone verification
        user.isPhoneVerified = true;
        await user.save();
      }

      // Generate tokens
      const { accessToken, refreshToken } = tokenService.generateTokenPair(
        user._id.toString(),
        user.role
      );

      // Store refresh token
      await tokenService.storeRefreshToken(user._id.toString(), refreshToken);

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
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token required' });
      }

      // Rotate refresh token
      const tokens = await tokenService.rotateRefreshToken(refreshToken);

      // Store new refresh token
      const decoded = await tokenService.verifyRefreshToken(tokens.refreshToken);
      await tokenService.storeRefreshToken(decoded.userId, tokens.refreshToken);

      return res.status(200).json({
        message: 'Token refreshed successfully',
        ...tokens,
      });
    } catch (error) {
      console.error('Refresh Token Error:', error);
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
  }

  // Logout
  async logout(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      // Blacklist access token
      await tokenService.blacklistToken(token, 900); // 15 minutes

      // Remove refresh token
      await tokenService.removeRefreshToken(req.userId);

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
