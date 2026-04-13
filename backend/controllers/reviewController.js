const Review = require('../models/Review');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');

const createReview = async (req, res, next) => {
  try {
    const { orderId, restaurantId, menuItemId, rating, comment } = req.body;
    
    const order = await Order.findOne({
      _id: orderId,
      customer: req.user._id,
      orderStatus: 'delivered'
    });
    
    if (!order) {
      return res.status(400).json({ message: 'Invalid order or order not delivered' });
    }
    
    const existingReview = await Review.findOne({
      order: orderId,
      customer: req.user._id
    });
    
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this order' });
    }
    
    const review = new Review({
      customer: req.user._id,
      order: orderId,
      restaurant: restaurantId,
      menuItem: menuItemId,
      rating,
      comment
    });
    
    await review.save();
    
    if (restaurantId) {
      const restaurantReviews = await Review.find({ restaurant: restaurantId });
      const avgRating = restaurantReviews.reduce((sum, r) => sum + r.rating, 0) / restaurantReviews.length;
      
      await Restaurant.findByIdAndUpdate(restaurantId, {
        rating: avgRating.toFixed(1),
        totalReviews: restaurantReviews.length
      });
    }
    
    if (menuItemId) {
      const menuItemReviews = await Review.find({ menuItem: menuItemId });
      const avgRating = menuItemReviews.reduce((sum, r) => sum + r.rating, 0) / menuItemReviews.length;
      
      await MenuItem.findByIdAndUpdate(menuItemId, {
        rating: avgRating.toFixed(1),
        totalReviews: menuItemReviews.length
      });
    }
    
    res.status(201).json({ message: 'Review submitted successfully', review });
  } catch (error) {
    next(error);
  }
};

const getRestaurantReviews = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    
    const reviews = await Review.find({ restaurant: restaurantId })
      .populate('customer', 'name')
      .sort({ createdAt: -1 });
    
    res.json({ reviews });
  } catch (error) {
    next(error);
  }
};

module.exports = { createReview, getRestaurantReviews };