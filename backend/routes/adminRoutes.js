const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Public banner endpoint (no admin role needed, just auth)
router.get('/banners', getBanners);

router.use(roleMiddleware('admin'));

router.get('/stats', getDashboardStats);
router.get('/dashboard', getExtendedDashboard);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.get('/restaurants/pending', getPendingRestaurants);
router.get('/restaurants', getAllRestaurants);
router.get('/restaurants/:id', getRestaurantDetails);
router.put('/restaurants/:id/status', updateRestaurantStatus);
router.put('/restaurants/:id/toggle-active', toggleRestaurantActive);
router.put('/restaurants/:id/commission', updateRestaurantCommission);
router.post('/restaurants/:id/menu', createRestaurantMenuItem);
router.put('/restaurants/:id/menu/:menuItemId', updateRestaurantMenuItem);
router.delete('/restaurants/:id/menu/:menuItemId', deleteRestaurantMenuItem);
router.get('/orders', getAllOrders);
router.post('/banners', upsertBanner);

module.exports = router;