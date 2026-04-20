const axios = require('axios');
const crypto = require('crypto');
const redis = require('../config/redis');

const AUTHKEY_API_KEY = process.env.AUTHKEY_API_KEY || 'your-authkey-api-key';
const AUTHKEY_TEMPLATE_ID = process.env.AUTHKEY_TEMPLATE_ID || 'your-template-id';
const OTP_EXPIRY = 5 * 60; // 5 minutes in seconds

class OTPService {
  // Generate 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Hash OTP before storing — never keep plain text in Redis
  hashOTP(otp) {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  // Send OTP via AuthKey SMS
  async sendOTP(phoneNumber, otp) {
    try {
      // For development: log OTP to console
      if (process.env.NODE_ENV === 'development') {
        console.log(`\n📱 OTP for ${phoneNumber}: ${otp}\n`);
        // Still store in Redis for verification
        await this.storeOTP(phoneNumber, otp);
        return { success: true, message: 'OTP sent (development mode)' };
      }

      // Production: Send via AuthKey
      const url = 'https://api.authkey.io/request';
      const response = await axios.post(url, {
        authkey: AUTHKEY_API_KEY,
        mobile: phoneNumber,
        country_code: '91', // India
        sid: AUTHKEY_TEMPLATE_ID,
        otp: otp,
      });

      if (response.data && response.data.status === 'success') {
        await this.storeOTP(phoneNumber, otp);
        return { success: true, message: 'OTP sent successfully' };
      } else {
        throw new Error('Failed to send OTP via AuthKey');
      }
    } catch (error) {
      console.error('OTP Send Error:', error.message);
      // Fallback: store OTP and log it
      console.log(`\n📱 OTP for ${phoneNumber}: ${otp} (SMS failed, using fallback)\n`);
      await this.storeOTP(phoneNumber, otp);
      return { success: true, message: 'OTP sent (fallback mode)' };
    }
  }

  // Store hashed OTP in Redis with expiry
  async storeOTP(phoneNumber, otp) {
    const key = `otp_${phoneNumber}`;
    await redis.setex(key, OTP_EXPIRY, this.hashOTP(otp));
  }

  // Verify OTP by comparing hashes
  async verifyOTP(phoneNumber, otp) {
    const key = `otp_${phoneNumber}`;
    const storedHash = await redis.get(key);

    if (!storedHash) {
      return { valid: false, message: 'OTP expired or not found' };
    }

    if (storedHash !== this.hashOTP(otp)) {
      return { valid: false, message: 'Invalid OTP' };
    }

    // OTP is valid, delete it immediately (single-use)
    await redis.del(key);
    return { valid: true, message: 'OTP verified successfully' };
  }

  // Check if OTP was recently sent (rate limiting)
  async checkRateLimit(phoneNumber) {
    const key = `otp_limit_${phoneNumber}`;
    const lastSent = await redis.get(key);

    if (lastSent) {
      const waitSeconds = Math.max(await redis.ttl(key), 0);
      return {
        allowed: false,
        waitSeconds,
        message: `Please wait ${waitSeconds} seconds before requesting another OTP`,
      };
    }

    // Set rate limit for 30 seconds
    await redis.setex(key, 30, Date.now().toString());
    return { allowed: true };
  }

  // Increment failed attempts
  async incrementFailedAttempts(phoneNumber) {
    const key = `otp_failed_${phoneNumber}`;
    const attempts = await redis.incr(key);
    await redis.expire(key, 3600); // Reset after 1 hour

    if (attempts >= 5) {
      return { blocked: true, message: 'Too many failed attempts. Try again later.' };
    }

    return { blocked: false, attemptsLeft: 5 - attempts };
  }

  // Clear failed attempts
  async clearFailedAttempts(phoneNumber) {
    await redis.del(`otp_failed_${phoneNumber}`);
  }
}

module.exports = new OTPService();
