const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  toggleUserStatus,
  getPendingRestaurants,
  updateRestaurantStatus,
  getAllRestaurants,
  getAllOrders
} = require('../controllers/adminController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.use(authMiddleware);
router.use(roleMiddleware('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.get('/restaurants/pending', getPendingRestaurants);
router.get('/restaurants', getAllRestaurants);
router.put('/restaurants/:id/status', updateRestaurantStatus);
router.get('/orders', getAllOrders);

module.exports = router;