const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { uploadFile, getFile, APP_NAME } = require('../config/storage');
const { authMiddleware } = require('../middleware/auth');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

router.post('/restaurant-cover/:restaurantId', authMiddleware, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    
    const restaurant = await Restaurant.findOne({
      _id: req.params.restaurantId,
      owner: req.user._id
    });
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found or unauthorized' });
    }
    
    const ext = req.file.originalname.split('.').pop() || 'jpg';
    const path = `${APP_NAME}/restaurants/${req.user._id}/${uuidv4()}.${ext}`;
    
    const result = await uploadFile(path, req.file.buffer, req.file.mimetype);
    
    restaurant.coverImage = {
      url: `/api/upload/file/${encodeURIComponent(result.path)}`,
      storagePath: result.path
    };
    
    await restaurant.save();
    
    res.json({
      message: 'Cover image uploaded successfully',
      url: restaurant.coverImage.url
    });
  } catch (error) {
    next(error);
  }
});

router.post('/menu-item/:menuItemId', authMiddleware, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    
    const menuItem = await MenuItem.findById(req.params.menuItemId).populate('restaurant');
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    if (menuItem.restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const ext = req.file.originalname.split('.').pop() || 'jpg';
    const path = `${APP_NAME}/menu/${req.user._id}/${uuidv4()}.${ext}`;
    
    const result = await uploadFile(path, req.file.buffer, req.file.mimetype);
    
    menuItem.image = {
      url: `/api/upload/file/${encodeURIComponent(result.path)}`,
      storagePath: result.path
    };
    
    await menuItem.save();
    
    res.json({
      message: 'Menu item image uploaded successfully',
      url: menuItem.image.url
    });
  } catch (error) {
    next(error);
  }
});

router.get('/file/:path(*)', async (req, res, next) => {
  try {
    const path = decodeURIComponent(req.params.path);
    const { data, contentType } = await getFile(path);
    
    res.setHeader('Content-Type', contentType);
    res.send(data);
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({ message: 'File not found' });
    }
    next(error);
  }
});

module.exports = router;