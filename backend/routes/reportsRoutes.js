const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportsController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.use(authMiddleware, roleMiddleware('admin', 'finance_admin', 'sub_admin'));

router.get('/monthly-revenue', ctrl.monthlyRevenue);
router.get('/top-restaurants', ctrl.topRestaurants);
router.get('/cuisine-breakdown', ctrl.cuisineBreakdown);
router.get('/orders-overview', ctrl.ordersOverview);

module.exports = router;
