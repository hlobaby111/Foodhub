const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
  getRestaurantOrders,
  updateOrderStatus,
  cancelOrder,
  getNotifications,
  markNotificationsRead
} = require('../controllers/orderController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.post('/', authMiddleware, createOrder);
router.post('/verify-payment', authMiddleware, verifyPayment);
router.get('/my', authMiddleware, getMyOrders);
router.get('/restaurant', authMiddleware, roleMiddleware('restaurant_owner'), getRestaurantOrders);
router.get('/notifications/list', authMiddleware, roleMiddleware('restaurant_owner'), getNotifications);
router.put('/notifications/read', authMiddleware, roleMiddleware('restaurant_owner'), markNotificationsRead);
router.get('/:id', authMiddleware, getOrderById);
router.put('/:id/status', authMiddleware, roleMiddleware('restaurant_owner'), updateOrderStatus);
router.put('/:id/cancel', authMiddleware, cancelOrder);

module.exports = router;