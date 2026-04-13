const express = require('express');
const router = express.Router();
const { getDeliveryDashboard, getAvailableOrders, acceptDelivery, updateDeliveryLocation, markDelivered, toggleAvailability } = require('../controllers/deliveryController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.use(authMiddleware);
router.use(roleMiddleware('delivery_partner'));
router.get('/dashboard', getDeliveryDashboard);
router.get('/available', getAvailableOrders);
router.put('/accept/:id', acceptDelivery);
router.put('/location/:id', updateDeliveryLocation);
router.put('/delivered/:id', markDelivered);
router.put('/toggle-availability', toggleAvailability);

module.exports = router;
