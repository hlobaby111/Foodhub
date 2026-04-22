const Payout = require('../models/Payout');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');

exports.listPayouts = async (req, res, next) => {
  try {
    const { payeeType, status } = req.query;
    const q = {};
    if (payeeType) q.payeeType = payeeType;
    if (status) q.status = status;
    const payouts = await Payout.find(q).sort({ createdAt: -1 }).limit(200);
    res.json({ payouts });
  } catch (e) { next(e); }
};

exports.triggerRestaurantPayout = async (req, res, next) => {
  try {
    const { restaurantId, periodStart, periodEnd } = req.body;
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    const orders = await Order.find({
      restaurant: restaurantId,
      paymentStatus: 'completed',
      orderStatus: 'delivered',
      createdAt: { $gte: new Date(periodStart), $lte: new Date(periodEnd) }
    });

    const gross = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const commissionPct = restaurant.commissionPercent || 18;
    const commission = +(gross * commissionPct / 100).toFixed(2);
    const net = +(gross - commission).toFixed(2);

    const payout = await Payout.create({
      payeeType: 'restaurant',
      payee: restaurant._id,
      payeeModel: 'Restaurant',
      periodStart, periodEnd,
      grossAmount: gross,
      commission,
      netAmount: net,
      orderCount: orders.length,
      status: 'processing',
      triggeredBy: req.userId
    });

    res.status(201).json({ payout });
  } catch (e) { next(e); }
};

exports.markPayoutPaid = async (req, res, next) => {
  try {
    const { transactionId } = req.body;
    const payout = await Payout.findById(req.params.id);
    if (!payout) return res.status(404).json({ message: 'Payout not found' });
    payout.status = 'paid';
    payout.transactionId = transactionId;
    payout.paidAt = new Date();
    await payout.save();
    res.json({ payout });
  } catch (e) { next(e); }
};

exports.holdPayout = async (req, res, next) => {
  try {
    const payout = await Payout.findById(req.params.id);
    if (!payout) return res.status(404).json({ message: 'Payout not found' });
    payout.status = 'on_hold';
    payout.notes = req.body.reason;
    await payout.save();
    res.json({ payout });
  } catch (e) { next(e); }
};
