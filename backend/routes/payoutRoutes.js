const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/payoutController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.use(authMiddleware, roleMiddleware('admin', 'finance_admin'));

router.get('/', ctrl.listPayouts);
router.post('/restaurant', ctrl.triggerRestaurantPayout);
router.put('/:id/paid', ctrl.markPayoutPaid);
router.put('/:id/hold', ctrl.holdPayout);

module.exports = router;
