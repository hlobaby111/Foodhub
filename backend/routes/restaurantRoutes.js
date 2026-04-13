const express = require('express');
const router = express.Router();
const {
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  getMyRestaurants
} = require('../controllers/restaurantController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.get('/', getRestaurants);
router.get('/my', authMiddleware, roleMiddleware('restaurant_owner'), getMyRestaurants);
router.get('/:id', getRestaurantById);
router.post('/', authMiddleware, roleMiddleware('restaurant_owner'), createRestaurant);
router.put('/:id', authMiddleware, roleMiddleware('restaurant_owner'), updateRestaurant);

module.exports = router;