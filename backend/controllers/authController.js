const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const tokenService = require('../services/tokenService');

// Shared cookie configuration
const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 15 * 60 * 1000, // 15 minutes — matches access token expiry
};

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days — matches refresh token expiry
};

const CLEAR_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, address, restaurantDetails } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      role: role || 'customer',
      address
    });
    
    await user.save();
    
    if (role === 'restaurant_owner' && restaurantDetails) {
      const restaurant = new Restaurant({
        ...restaurantDetails,
        owner: user._id,
        status: 'pending'
      });
      await restaurant.save();
    }
    
    const { accessToken, refreshToken } = tokenService.generateTokenPair(user._id.toString(), user.role);
    await tokenService.storeRefreshToken(user._id.toString(), refreshToken);

    const userResponse = user.toObject();
    delete userResponse.password;

    // Set httpOnly cookies for web clients
    res.cookie('access_token', accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);
    
    res.status(201).json({
      message: 'Registration successful',
      user: userResponse,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const { accessToken, refreshToken } = tokenService.generateTokenPair(user._id.toString(), user.role);
    await tokenService.storeRefreshToken(user._id.toString(), refreshToken);

    const userResponse = user.toObject();
    delete userResponse.password;

    // Set httpOnly cookies for web clients
    res.cookie('access_token', accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);
    
    res.json({
      message: 'Login successful',
      user: userResponse,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, address },
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    next(error);
  }
};

// Logout — clears httpOnly cookies (web) and blacklists access token
const logout = async (req, res, next) => {
  try {
    // Support both cookie-based (web) and body-based (mobile) token sources
    const accessToken =
      req.cookies?.access_token ||
      req.headers.authorization?.replace('Bearer ', '');
    const refreshToken =
      req.cookies?.refresh_token ||
      req.body?.refreshToken;

    if (accessToken) {
      await tokenService.blacklistToken(accessToken, 900); // 15 min
    }
    if (refreshToken && req.user) {
      await tokenService.removeRefreshToken(req.user._id.toString(), refreshToken);
    }

    // Clear web cookies
    res.clearCookie('access_token', CLEAR_COOKIE_OPTIONS);
    res.clearCookie('refresh_token', CLEAR_COOKIE_OPTIONS);

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// Refresh token endpoint for web (reads httpOnly cookies, sets new ones)
const refreshWebToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token provided' });
    }

    const tokens = await tokenService.rotateRefreshToken(refreshToken);
    await tokenService.storeRefreshToken(
      (await tokenService.verifyRefreshToken(tokens.refreshToken)).userId,
      tokens.refreshToken
    );

    // Set new httpOnly cookies
    res.cookie('access_token', tokens.accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie('refresh_token', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);

    res.json({ message: 'Token refreshed successfully' });
  } catch (error) {
    res.clearCookie('access_token', CLEAR_COOKIE_OPTIONS);
    res.clearCookie('refresh_token', CLEAR_COOKIE_OPTIONS);
    res.status(401).json({ message: 'Session expired, please log in again' });
  }
};

module.exports = { register, login, getProfile, updateProfile, logout, refreshWebToken };

