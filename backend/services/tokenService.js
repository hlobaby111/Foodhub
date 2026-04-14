const jwt = require('jsonwebtoken');
const redis = require('../config/redis');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production';
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

class TokenService {
  // Generate access token (short-lived)
  generateAccessToken(userId, role) {
    return jwt.sign(
      { userId, role, type: 'access' },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
  }

  // Generate refresh token (long-lived)
  generateRefreshToken(userId, role) {
    return jwt.sign(
      { userId, role, type: 'refresh' },
      JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
  }

  // Generate both tokens
  generateTokenPair(userId, role) {
    const accessToken = this.generateAccessToken(userId, role);
    const refreshToken = this.generateRefreshToken(userId, role);
    return { accessToken, refreshToken };
  }

  // Verify access token
  async verifyAccessToken(token) {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await redis.get(`bl_${token}`);
      if (isBlacklisted) {
        throw new Error('Token has been revoked');
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }
      return decoded;
    } catch (error) {
      throw error;
    }
  }

  // Verify refresh token
  async verifyRefreshToken(token) {
    try {
      const isBlacklisted = await redis.get(`bl_${token}`);
      if (isBlacklisted) {
        throw new Error('Token has been revoked');
      }

      const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      return decoded;
    } catch (error) {
      throw error;
    }
  }

  // Blacklist a token (for logout)
  async blacklistToken(token, expiryInSeconds = 900) {
    await redis.setex(`bl_${token}`, expiryInSeconds, 'true');
  }

  // Store refresh token in Redis
  async storeRefreshToken(userId, token) {
    const key = `refresh_${userId}`;
    await redis.setex(key, 7 * 24 * 60 * 60, token); // 7 days
  }

  // Remove refresh token
  async removeRefreshToken(userId) {
    await redis.del(`refresh_${userId}`);
  }

  // Rotate refresh token (invalidate old, generate new)
  async rotateRefreshToken(oldToken) {
    const decoded = await this.verifyRefreshToken(oldToken);
    await this.blacklistToken(oldToken, 7 * 24 * 60 * 60);
    return this.generateTokenPair(decoded.userId, decoded.role);
  }
}

module.exports = new TokenService();
