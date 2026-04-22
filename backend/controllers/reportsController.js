const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');

exports.monthlyRevenue = async (req, res, next) => {
  try {
    const months = Number(req.query.months || 6);
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const data = await Order.aggregate([
      { $match: { paymentStatus: 'completed', createdAt: { $gte: since } } },
      {
        $group: {
          _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } }
    ]);
    res.json({ data });
  } catch (e) { next(e); }
};

exports.topRestaurants = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit || 10);
    const data = await Order.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: '$restaurant', orders: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
      { $sort: { orders: -1 } },
      { $limit: limit },
      { $lookup: { from: 'restaurants', localField: '_id', foreignField: '_id', as: 'restaurant' } },
      { $unwind: '$restaurant' },
      { $project: { name: '$restaurant.name', orders: 1, revenue: 1 } }
    ]);
    res.json({ data });
  } catch (e) { next(e); }
};

exports.cuisineBreakdown = async (req, res, next) => {
  try {
    const data = await Restaurant.aggregate([
      { $unwind: '$cuisineType' },
      { $group: { _id: '$cuisineType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]);
    res.json({ data });
  } catch (e) { next(e); }
};

exports.ordersOverview = async (req, res, next) => {
  try {
    const data = await Order.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
    ]);
    res.json({ data });
  } catch (e) { next(e); }
};
