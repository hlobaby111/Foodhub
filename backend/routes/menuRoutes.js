const express = require('express');
const router = express.Router();
const {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getMyMenuItems
} = require('../controllers/menuController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.get('/', getMenuItems);
router.get('/my', authMiddleware, roleMiddleware('restaurant_owner'), getMyMenuItems);
router.post('/', authMiddleware, roleMiddleware('restaurant_owner'), createMenuItem);
router.put('/:id', authMiddleware, roleMiddleware('restaurant_owner'), updateMenuItem);
router.delete('/:id', authMiddleware, roleMiddleware('restaurant_owner'), deleteMenuItem);

module.exports = router;