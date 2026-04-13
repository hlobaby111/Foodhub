const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
  getRestaurantOrders,
  updateOrderStatus
} = require('../controllers/orderController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.post('/', authMiddleware, createOrder);
router.post('/verify-payment', authMiddleware, verifyPayment);
router.get('/my', authMiddleware, getMyOrders);
router.get('/restaurant', authMiddleware, roleMiddleware('restaurant_owner'), getRestaurantOrders);
router.get('/:id', authMiddleware, getOrderById);
router.put('/:id/status', authMiddleware, roleMiddleware('restaurant_owner'), updateOrderStatus);

module.exports = router;