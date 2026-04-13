const User = require('../models/User');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');

const getDeliveryDashboard = async (req, res, next) => {
  try {
    const activeOrders = await Order.find({
      deliveryPartner: req.user._id,
      orderStatus: { $in: ['ready', 'picked_up', 'out_for_delivery'] }
    }).populate('customer', 'name phone').populate('restaurant', 'name location coordinates phone').sort({ createdAt: -1 });

    const completedToday = await Order.countDocuments({
      deliveryPartner: req.user._id,
      orderStatus: 'delivered',
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });

    const totalDelivered = await Order.countDocuments({ deliveryPartner: req.user._id, orderStatus: 'delivered' });

    res.json({ activeOrders, completedToday, totalDelivered, isAvailable: req.user.isAvailable });
  } catch (error) { next(error); }
};

const getAvailableOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({
      orderStatus: 'ready',
      deliveryPartner: null
    }).populate('customer', 'name phone').populate('restaurant', 'name location coordinates phone').sort({ createdAt: -1 }).limit(20);
    res.json({ orders });
  } catch (error) { next(error); }
};

const acceptDelivery = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.deliveryPartner) return res.status(400).json({ message: 'Already assigned' });
    if (order.orderStatus !== 'ready') return res.status(400).json({ message: 'Order not ready for pickup' });

    order.deliveryPartner = req.user._id;
    order.orderStatus = 'picked_up';
    order.statusHistory.push({ status: 'picked_up' });
    await order.save();

    res.json({ message: 'Delivery accepted', order });
  } catch (error) { next(error); }
};

const updateDeliveryLocation = async (req, res, next) => {
  try {
    const { lat, lng } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order || order.deliveryPartner?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    order.deliveryPartnerLocation = { lat, lng, updatedAt: new Date() };
    await order.save();

    // Emit via socket if available
    const io = req.app.get('io');
    if (io) {
      io.to(`order_${order._id}`).emit('delivery_location', { lat, lng, updatedAt: new Date() });
    }

    res.json({ message: 'Location updated' });
  } catch (error) { next(error); }
};

const markDelivered = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order || order.deliveryPartner?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    order.orderStatus = 'delivered';
    order.statusHistory.push({ status: 'delivered' });
    if (order.paymentMethod === 'cash') order.paymentStatus = 'completed';
    await order.save();

    const io = req.app.get('io');
    if (io) io.to(`order_${order._id}`).emit('order_update', { orderId: order._id, status: 'delivered' });

    res.json({ message: 'Order delivered', order });
  } catch (error) { next(error); }
};

const toggleAvailability = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.isAvailable = !user.isAvailable;
    await user.save();
    res.json({ message: `You are now ${user.isAvailable ? 'online' : 'offline'}`, isAvailable: user.isAvailable });
  } catch (error) { next(error); }
};

module.exports = { getDeliveryDashboard, getAvailableOrders, acceptDelivery, updateDeliveryLocation, markDelivered, toggleAvailability };
