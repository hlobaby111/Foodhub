const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
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
    
    const token = generateToken(user._id);
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json({
      message: 'Registration successful',
      user: userResponse,
      token
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
    
    const token = generateToken(user._id);
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({
      message: 'Login successful',
      user: userResponse,
      token
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

module.exports = { register, login, getProfile, updateProfile };