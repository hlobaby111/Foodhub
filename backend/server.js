require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./config/database');
const { initStorage } = require('./config/storage');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const addressRoutes = require('./routes/addressRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');

const app = express();
const server = http.createServer(app);

// WebSocket setup
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  path: '/api/socket.io'
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_order', (orderId) => {
    socket.join(`order_${orderId}`);
    console.log(`Socket ${socket.id} joined order_${orderId}`);
  });

  socket.on('leave_order', (orderId) => {
    socket.leave(`order_${orderId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/delivery', deliveryRoutes);

// Public banners endpoint
app.get('/api/banners', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    const banners = await db.collection('banners').find({ isActive: true }).sort({ order: 1 }).toArray();
    res.json({ banners: banners.map(b => ({ ...b, _id: b._id.toString() })) });
  } catch (error) { res.json({ banners: [] }); }
});

// Restaurant settings update (owner)
const Restaurant = require('./models/Restaurant');
const { authMiddleware } = require('./middleware/auth');

app.put('/api/restaurants/:id/settings', authMiddleware, async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ _id: req.params.id, owner: req.user._id });
    if (!restaurant) return res.status(404).json({ message: 'Not found' });
    const { isVeg, deliveryTime, avgPrepTime, openingHours, minimumOrder, photos } = req.body;
    if (isVeg !== undefined) restaurant.isVeg = isVeg;
    if (deliveryTime) restaurant.deliveryTime = deliveryTime;
    if (avgPrepTime) restaurant.avgPrepTime = avgPrepTime;
    if (openingHours) restaurant.openingHours = openingHours;
    if (minimumOrder !== undefined) restaurant.minimumOrder = minimumOrder;
    if (photos) restaurant.photos = photos;
    await restaurant.save();
    res.json({ message: 'Settings updated', restaurant });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// Search restaurants (instant)
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ restaurants: [] });
    const MenuItem = require('./models/MenuItem');
    const restaurants = await Restaurant.find({
      status: 'approved', isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { cuisineType: { $regex: q, $options: 'i' } }
      ]
    }).limit(10).sort({ rating: -1 });
    const menuMatches = await MenuItem.find({
      name: { $regex: q, $options: 'i' }, isAvailable: true
    }).populate('restaurant', 'name location rating status').limit(10);
    const dishRestaurants = menuMatches
      .filter(m => m.restaurant?.status === 'approved')
      .map(m => ({ ...m.restaurant.toObject(), matchedDish: m.name }));
    res.json({ restaurants, dishMatches: dishRestaurants });
  } catch (error) { res.json({ restaurants: [], dishMatches: [] }); }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Food Delivery API is running', websocket: true });
});

app.use(errorHandler);

const PORT = process.env.PORT || 8001;

const startServer = async () => {
  try {
    await connectDB();
    try { await initStorage(); } catch (e) { console.warn('Storage init failed:', e.message); }
    await require('./utils/seed')();

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT} with WebSocket`);
    });
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
};

startServer();
