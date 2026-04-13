const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');

const getDashboardStats = async (req, res, next) => {
  try {
    const [totalUsers, totalRestaurants, totalOrders, totalRevenue] = await Promise.all([
      User.countDocuments(),
      Restaurant.countDocuments({ status: 'approved' }),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);
    
    const pendingRestaurants = await Restaurant.countDocuments({ status: 'pending' });
    
    res.json({
      stats: {
        totalUsers,
        totalRestaurants,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingRestaurants
      }
    });
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      User.find().select('-password').skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      User.countDocuments()
    ]);
    
    res.json({
      users,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot deactivate admin users' });
    }
    
    user.isActive = !user.isActive;
    await user.save();
    
    res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`, user });
  } catch (error) {
    next(error);
  }
};

const getPendingRestaurants = async (req, res, next) => {
  try {
    const restaurants = await Restaurant.find({ status: 'pending' })
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 });
    
    res.json({ restaurants });
  } catch (error) {
    next(error);
  }
};

const updateRestaurantStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const restaurant = await Restaurant.findById(req.params.id);
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    restaurant.status = status;
    await restaurant.save();
    
    res.json({ message: `Restaurant ${status} successfully`, restaurant });
  } catch (error) {
    next(error);
  }
};

const getAllRestaurants = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const [restaurants, total] = await Promise.all([
      Restaurant.find()
        .populate('owner', 'name email')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Restaurant.countDocuments()
    ]);
    
    res.json({
      restaurants,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;
    
    const query = {};
    if (status) {
      query.orderStatus = status;
    }
    
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('customer', 'name email')
        .populate('restaurant', 'name')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Order.countDocuments(query)
    ]);
    
    res.json({
      orders,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  toggleUserStatus,
  getPendingRestaurants,
  updateRestaurantStatus,
  getAllRestaurants,
  getAllOrders
};