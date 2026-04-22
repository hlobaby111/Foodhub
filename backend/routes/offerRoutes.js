const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/offerController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.use(authMiddleware, roleMiddleware('admin', 'sub_admin'));

router.get('/', ctrl.listOffers);
router.post('/', ctrl.createOffer);
router.put('/:id', ctrl.updateOffer);
router.put('/:id/toggle', ctrl.toggleOffer);
router.delete('/:id', ctrl.deleteOffer);

module.exports = router;
