const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/refundController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// customers can create a refund request
router.post('/', ctrl.createRefund);

// admin-only
router.get('/', roleMiddleware('admin', 'finance_admin'), ctrl.listRefunds);
router.put('/:id/decide', roleMiddleware('admin', 'finance_admin'), ctrl.decideRefund);

module.exports = router;
