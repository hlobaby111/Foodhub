const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/deliveryAdminController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.use(authMiddleware, roleMiddleware('admin', 'sub_admin'));

router.get('/partners', ctrl.listPartners);
router.get('/partners/:id', ctrl.getPartner);
router.put('/partners/:id/kyc', ctrl.decideKyc);
router.put('/partners/:id/toggle', ctrl.togglePartner);

module.exports = router;
