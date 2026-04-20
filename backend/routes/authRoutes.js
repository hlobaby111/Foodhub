const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, logout, refreshWebToken } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.post('/logout', authMiddleware, logout);
router.post('/refresh-token', refreshWebToken);

module.exports = router;
