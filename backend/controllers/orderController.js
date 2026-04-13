const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const generateOrderNumber = () => {
  return 'ORD' + Date.now() + Math.floor(Math.random() * 1000);
};

const createOrder = async (req, res, next) => {
  try {
    const { restaurantId, items, deliveryAddress, paymentMethod, customerPhone, notes } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }
    
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant || restaurant.status !== 'approved') {
      return res.status(404).json({ message: 'Restaurant not available' });
    }
    
    let totalAmount = 0;
    const orderItems = [];
    
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (!menuItem || !menuItem.isAvailable) {
        return res.status(400).json({ message: `Item ${item.name} is not available` });
      }
      
      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity
      });
      
      totalAmount += menuItem.price * item.quantity;
    }
    
    const orderNumber = generateOrderNumber();
    
    const order = new Order({
      orderNumber,
      customer: req.user._id,
      restaurant: restaurantId,
      items: orderItems,
      totalAmount,
      deliveryAddress,
      paymentMethod,
      customerPhone,
      notes,
      statusHistory: [{ status: 'placed' }]
    });
    
    if (paymentMethod === 'online') {
      const razorpayOrder = await razorpay.orders.create({
        amount: totalAmount * 100,
        currency: 'INR',
        receipt: orderNumber,
        payment_capture: 1
      });
      
      order.razorpayOrderId = razorpayOrder.id;
    } else {
      order.paymentStatus = 'pending';
    }
    
    await order.save();
    
    res.status(201).json({
      message: 'Order created successfully',
      order,
      razorpayOrderId: order.razorpayOrderId,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
    
    const crypto = require('crypto');
    const sign = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');
    
    if (razorpaySignature === expectedSign) {
      const order = await Order.findById(orderId);
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      order.paymentStatus = 'completed';
      order.razorpayPaymentId = razorpayPaymentId;
      order.orderStatus = 'accepted';
      order.statusHistory.push({ status: 'accepted' });
      
      await order.save();
      
      res.json({ message: 'Payment verified successfully', order });
    } else {
      return res.status(400).json({ message: 'Payment verification failed' });
    }
  } catch (error) {
    next(error);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate('restaurant', 'name location phone')
      .sort({ createdAt: -1 });
    
    res.json({ orders });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('restaurant', 'name location phone')
      .populate('items.menuItem');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.customer._id.toString() !== req.user._id.toString() && req.user.role === 'customer') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    res.json({ order });
  } catch (error) {
    next(error);
  }
};

const getRestaurantOrders = async (req, res, next) => {
  try {
    const restaurants = await Restaurant.find({ owner: req.user._id });
    const restaurantIds = restaurants.map(r => r._id);
    
    const { status } = req.query;
    const query = { restaurant: { $in: restaurantIds } };
    
    if (status) {
      query.orderStatus = status;
    }
    
    const orders = await Order.find(query)
      .populate('customer', 'name phone')
      .populate('restaurant', 'name')
      .sort({ createdAt: -1 });
    
    res.json({ orders });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    const order = await Order.findById(req.params.id).populate('restaurant');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    order.orderStatus = status;
    order.statusHistory.push({ status });
    
    await order.save();
    
    res.json({ message: 'Order status updated successfully', order });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
  getRestaurantOrders,
  updateOrderStatus
};