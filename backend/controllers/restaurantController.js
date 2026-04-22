const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');

const getRestaurants = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, location, search, cuisineType } = req.query;
    
    const query = { status: 'approved', isActive: true };
    
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (cuisineType) {
      query.cuisineType = cuisineType;
    }
    
    const skip = (page - 1) * limit;
    
    const [restaurants, total] = await Promise.all([
      Restaurant.find(query)
        .populate('owner', 'name email')
        .skip(skip)
        .limit(Number(limit))
        .sort({ rating: -1, createdAt: -1 }),
      Restaurant.countDocuments(query)
    ]);
    
    res.json({
      restaurants,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getRestaurantById = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
      .populate('owner', 'name email phone');
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    const menuItems = await MenuItem.find({ 
      restaurant: restaurant._id, 
      isAvailable: true 
    }).sort({ category: 1, name: 1 });
    
    res.json({ restaurant, menuItems });
  } catch (error) {
    next(error);
  }
};

const createRestaurant = async (req, res, next) => {
  try {
    const restaurantData = {
      ...req.body,
      owner: req.user._id,
      status: 'pending'
    };
    
    const restaurant = new Restaurant(restaurantData);
    await restaurant.save();
    
    res.status(201).json({
      message: 'Restaurant registration submitted. Awaiting admin approval.',
      restaurant
    });
  } catch (error) {
    next(error);
  }
};

const updateRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({
      _id: req.params.id,
      owner: req.user._id
    });
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found or unauthorized' });
    }
    
    const { name, description, phone, address, location, cuisineType, openingHours, minimumOrder, deliveryTime } = req.body;
    
    Object.assign(restaurant, {
      name: name || restaurant.name,
      description: description || restaurant.description,
      phone: phone || restaurant.phone,
      address: address || restaurant.address,
      location: location || restaurant.location,
      cuisineType: cuisineType || restaurant.cuisineType,
      openingHours: openingHours || restaurant.openingHours,
      minimumOrder: minimumOrder !== undefined ? minimumOrder : restaurant.minimumOrder,
      deliveryTime: deliveryTime || restaurant.deliveryTime
    });
    
    await restaurant.save();
    
    res.json({ message: 'Restaurant updated successfully', restaurant });
  } catch (error) {
    next(error);
  }
};

const getMyRestaurants = async (req, res, next) => {
  try {
    const restaurants = await Restaurant.find({ owner: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json({ restaurants });
  } catch (error) {
    next(error);
  }
};

const toggleMyRestaurantActive = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id })
      .sort({ createdAt: -1 });

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    restaurant.isActive = !restaurant.isActive;
    await restaurant.save();

    res.json({
      message: `Restaurant ${restaurant.isActive ? 'opened' : 'closed'} successfully`,
      restaurant,
    });
  } catch (error) {
    next(error);
  }
};

// Upsert restaurant owner profile (create or update the draft/full profile)
const upsertRestaurantProfile = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const {
      name, description, phone, secondaryPhone, email, address, location, cuisineType,
      openingHours, deliveryType, bankDetails, isVeg, minimumOrder, deliveryTime
    } = req.body;

    // Update user's name/email if provided
    if (name || email) {
      await User.findByIdAndUpdate(req.user._id, {
        ...(name && { name }),
        ...(email && { email }),
      });
    }

    let restaurant = await Restaurant.findOne({ owner: req.user._id });

    if (!restaurant) {
      // Create a new restaurant profile (draft, status=pending by default)
      restaurant = new Restaurant({
        owner: req.user._id,
        name: name || 'My Restaurant',
        description: description || '',
        phone: phone || req.user.phone,
        email: email || req.user.email || '',
        location: location || '',
        status: 'pending',
      });
    }

    // Apply all provided fields
    const fields = { name, description, phone, secondaryPhone, email, address, location,
      openingHours, deliveryType, bankDetails, minimumOrder, deliveryTime, isVeg };
    Object.keys(fields).forEach(k => {
      if (fields[k] !== undefined && fields[k] !== null && fields[k] !== '') {
        restaurant[k] = fields[k];
      }
    });

    if (cuisineType) restaurant.cuisineType = cuisineType;

    // Check profile completion
    const required = ['name', 'phone', 'location', 'openingHours'];
    const docRequired = ['ownerPan'];
    const bankRequired = restaurant.bankDetails?.holderName && restaurant.bankDetails?.accountNo && restaurant.bankDetails?.ifsc;
    const allFieldsFilled = required.every(f => !!restaurant[f]) && !!restaurant.ownerPan?.url && bankRequired;
    restaurant.profileCompleted = !!allFieldsFilled;

    await restaurant.save();

    res.json({ message: 'Profile saved', restaurant });
  } catch (error) {
    next(error);
  }
};

// Update document field on restaurant profile
const updateRestaurantDoc = async (req, res, next) => {
  try {
    const { field, url, storagePath } = req.body;
    const allowedFields = ['ownerAadhar', 'ownerPan', 'firmPan', 'gstDoc', 'fssaiDoc', 'menuDoc'];
    if (!allowedFields.includes(field)) {
      return res.status(400).json({ message: 'Invalid document field' });
    }
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) return res.status(404).json({ message: 'Restaurant profile not found' });

    restaurant[field] = { url, storagePath };
    await restaurant.save();
    res.json({ message: 'Document updated', restaurant });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  getMyRestaurants,
  toggleMyRestaurantActive,
  upsertRestaurantProfile,
  updateRestaurantDoc
};