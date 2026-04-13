const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  toggleUserStatus,
  getPendingRestaurants,
  updateRestaurantStatus,
  getAllRestaurants,
  getAllOrders,
  getBanners,
  upsertBanner
} = require('../controllers/adminController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Public banner endpoint (no admin role needed, just auth)
router.get('/banners', getBanners);

router.use(roleMiddleware('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.get('/restaurants/pending', getPendingRestaurants);
router.get('/restaurants', getAllRestaurants);
router.put('/restaurants/:id/status', updateRestaurantStatus);
router.get('/orders', getAllOrders);
router.post('/banners', upsertBanner);

module.exports = router;