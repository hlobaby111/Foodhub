const express = require('express');
const router = express.Router();
const {
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  getMyRestaurants,
  toggleMyRestaurantActive,
  upsertRestaurantProfile,
  updateRestaurantDoc
} = require('../controllers/restaurantController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.get('/', getRestaurants);
router.get('/my', authMiddleware, roleMiddleware('restaurant_owner'), getMyRestaurants);
router.put('/my/toggle-active', authMiddleware, roleMiddleware('restaurant_owner'), toggleMyRestaurantActive);
router.get('/:id', getRestaurantById);
router.post('/', authMiddleware, roleMiddleware('restaurant_owner'), createRestaurant);
router.put('/profile', authMiddleware, roleMiddleware('restaurant_owner'), upsertRestaurantProfile);
router.put('/profile/doc', authMiddleware, roleMiddleware('restaurant_owner'), updateRestaurantDoc);
router.put('/:id', authMiddleware, roleMiddleware('restaurant_owner'), updateRestaurant);

module.exports = router;