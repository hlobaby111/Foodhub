const Refund = require('../models/Refund');
const Order = require('../models/Order');

exports.createRefund = async (req, res, next) => {
  try {
    const { orderId, amount, reason, isPartial } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const refund = await Refund.create({
      order: order._id,
      customer: order.customer,
      restaurant: order.restaurant,
      amount,
      isPartial: !!isPartial,
      reason
    });
    res.status(201).json({ refund });
  } catch (e) { next(e); }
};

exports.listRefunds = async (req, res, next) => {
  try {
    const { status } = req.query;
    const q = {};
    if (status) q.status = status;
    const refunds = await Refund.find(q)
      .populate('customer', 'name phone')
      .populate('order', 'orderNumber totalAmount')
      .sort({ createdAt: -1 });
    res.json({ refunds });
  } catch (e) { next(e); }
};

exports.decideRefund = async (req, res, next) => {
  try {
    const { decision, adminNote } = req.body; // 'approved' | 'rejected'
    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ message: 'Invalid decision' });
    }
    const refund = await Refund.findById(req.params.id);
    if (!refund) return res.status(404).json({ message: 'Refund not found' });

    refund.status = decision;
    refund.adminNote = adminNote;
    refund.processedBy = req.userId;
    refund.processedAt = new Date();
    await refund.save();

    // TODO: trigger Razorpay refund when decision === 'approved'
    res.json({ refund });
  } catch (e) { next(e); }
};
