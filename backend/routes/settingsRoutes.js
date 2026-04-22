const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/settingsController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// public settings (min order, delivery radius, paused) can be read by any authed user
router.get('/', authMiddleware, ctrl.getSettings);

router.use(authMiddleware, roleMiddleware('admin'));
router.put('/', ctrl.updateSettings);
router.post('/pause', ctrl.pausePlatform);
router.post('/resume', ctrl.resumePlatform);

module.exports = router;
