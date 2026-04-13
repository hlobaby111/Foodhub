const express = require('express');
const router = express.Router();
const { createReview, getRestaurantReviews } = require('../controllers/reviewController');
const { authMiddleware } = require('../middleware/auth');

router.post('/', authMiddleware, createReview);
router.get('/restaurant/:restaurantId', getRestaurantReviews);

module.exports = router;