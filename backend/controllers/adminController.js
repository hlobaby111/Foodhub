const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const MenuItemImage = require('../models/MenuItemImage');
const Refund = require('../models/Refund');
const Payout = require('../models/Payout');
const Settings = require('../models/Settings');
const DeliveryPartner = require('../models/DeliveryPartner');

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

const getExtendedDashboard = async (req, res, next) => {
  try {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);

    const [
      todayOrders, todayRevenue, activeRestaurants, activeDeliveryBoys,
      pendingPayouts, pendingRefunds, settings
    ] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: startOfDay } }),
      Order.aggregate([
        { $match: { paymentStatus: 'completed', createdAt: { $gte: startOfDay } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Restaurant.countDocuments({ status: 'approved', isActive: true }),
      DeliveryPartner.countDocuments({ status: 'active', isOnline: true }),
      Payout.aggregate([
        { $match: { status: { $in: ['pending', 'processing'] } } },
        { $group: { _id: null, total: { $sum: '$netAmount' } } }
      ]),
      Refund.countDocuments({ status: 'pending' }),
      Settings.getSettings()
    ]);

    res.json({
      todayOrders,
      todayRevenue: todayRevenue[0]?.total || 0,
      activeRestaurants,
      activeDeliveryBoys,
      pendingPayouts: pendingPayouts[0]?.total || 0,
      pendingRefunds,
      platformPaused: settings.platformPaused,
      pauseReason: settings.pauseReason || '',
      settings: {
        platformFee: settings.platformFee,
        gstPercent: settings.gstPercent,
        defaultCommissionPercent: settings.defaultCommissionPercent,
        defaultDeliveryRadiusKm: settings.defaultDeliveryRadiusKm,
        baseDeliveryCharge: settings.baseDeliveryCharge,
        perKmCharge: settings.perKmCharge,
        minimumOrderValue: settings.minimumOrderValue,
        freeCancellationWindowMin: settings.freeCancellationWindowMin,
        cancellationFee: settings.cancellationFee,
      }
    });
  } catch (error) { next(error); }
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
    if (status === 'rejected') {
      restaurant.isActive = false;
    } else if (status === 'approved') {
      restaurant.isActive = true;
    }
    await restaurant.save();
    
    res.json({ success: true, restaurant });
  } catch (error) {
    next(error);
  }
};

const toggleRestaurantActive = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    restaurant.isActive = !restaurant.isActive;
    await restaurant.save();

    res.json({
      message: `Restaurant ${restaurant.isActive ? 'activated' : 'paused'} successfully`,
      restaurant,
    });
  } catch (error) {
    next(error);
  }
};

const updateRestaurantCommission = async (req, res, next) => {
  try {
    const commissionPercent = Number(req.body.commissionPercent);

    if (Number.isNaN(commissionPercent) || commissionPercent < 0 || commissionPercent > 100) {
      return res.status(400).json({ message: 'Commission must be between 0 and 100' });
    }

    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    restaurant.commissionPercent = commissionPercent;
    await restaurant.save();

    res.json({ message: 'Commission updated successfully', restaurant });
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
const getRestaurantDetails = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
      .populate('owner', 'name email phone');

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const menuItems = await MenuItem.find({ restaurant: restaurant._id })
      .sort({ category: 1, name: 1 });

    res.json({ restaurant, menuItems });
  } catch (error) {
    next(error);
  }
};

const createRestaurantMenuItem = async (req, res, next) => {
  try {
    const { name, description, price, category, isVegetarian, isAvailable, image } = req.body;

    if (!name || !description || price === undefined || !category) {
      return res.status(400).json({ message: 'name, description, price and category are required' });
    }

    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const menuItem = await MenuItem.create({
      restaurant: restaurant._id,
      name,
      description,
      price: Number(price),
      category,
      isVegetarian: Boolean(isVegetarian),
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      image: image && image.url ? image : undefined,
    });

    res.status(201).json({ message: 'Menu item created successfully', menuItem });
  } catch (error) {
    next(error);
  }
};

const updateRestaurantMenuItem = async (req, res, next) => {
  try {
    const menuItem = await MenuItem.findOne({
      _id: req.params.menuItemId,
      restaurant: req.params.id,
    });

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    const { name, description, price, category, isVegetarian, isAvailable, image } = req.body;

    if (name !== undefined) menuItem.name = name;
    if (description !== undefined) menuItem.description = description;
    if (price !== undefined) menuItem.price = Number(price);
    if (category !== undefined) menuItem.category = category;
    if (isVegetarian !== undefined) menuItem.isVegetarian = Boolean(isVegetarian);
    if (isAvailable !== undefined) menuItem.isAvailable = Boolean(isAvailable);
    if (image !== undefined) menuItem.image = image;

    await menuItem.save();
    res.json({ message: 'Menu item updated successfully', menuItem });
  } catch (error) {
    next(error);
  }
};

const deleteRestaurantMenuItem = async (req, res, next) => {
  try {
    const menuItem = await MenuItem.findOneAndDelete({
      _id: req.params.menuItemId,
      restaurant: req.params.id,
    });

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    await MenuItemImage.deleteOne({ menuItem: menuItem._id });

    res.json({ message: 'Menu item deleted successfully' });
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

const getBanners = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    const banners = await db.collection('banners')
      .find({ isActive: true })
      .sort({ order: 1 })
      .toArray();
    const sanitized = banners.map(b => ({ ...b, _id: b._id.toString() }));
    res.json({ banners: sanitized });
  } catch (error) {
    next(error);
  }
};

const upsertBanner = async (req, res, next) => {
  try {
    const { imageUrl, title, subtitle, link, order: bannerOrder } = req.body;
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    await db.collection('banners').insertOne({
      imageUrl, title, subtitle, link,
      order: bannerOrder || 0,
      isActive: true,
      createdAt: new Date()
    });
    res.json({ message: 'Banner added' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getExtendedDashboard,
  getAllUsers,
  toggleUserStatus,
  getPendingRestaurants,
  updateRestaurantStatus,
  toggleRestaurantActive,
  updateRestaurantCommission,
  getAllRestaurants,
  getRestaurantDetails,
  createRestaurantMenuItem,
  updateRestaurantMenuItem,
  deleteRestaurantMenuItem,
  getAllOrders,
  getBanners,
  upsertBanner
};