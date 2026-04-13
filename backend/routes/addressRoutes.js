const express = require('express');
const router = express.Router();
const { getSavedAddresses, addAddress, updateAddress, deleteAddress, updateCurrentLocation } = require('../controllers/addressController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);
router.get('/', getSavedAddresses);
router.post('/', addAddress);
router.put('/:addressId', updateAddress);
router.delete('/:addressId', deleteAddress);
router.put('/location/current', updateCurrentLocation);

module.exports = router;
