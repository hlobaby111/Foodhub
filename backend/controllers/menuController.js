const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');

const getMenuItems = async (req, res, next) => {
  try {
    const { restaurantId } = req.query;
    
    const query = { isAvailable: true };
    if (restaurantId) {
      query.restaurant = restaurantId;
    }
    
    const menuItems = await MenuItem.find(query)
      .populate('restaurant', 'name location')
      .sort({ category: 1, name: 1 });
    
    res.json({ menuItems });
  } catch (error) {
    next(error);
  }
};

const createMenuItem = async (req, res, next) => {
  try {
    const { restaurantId, name, description, price, category, isVegetarian } = req.body;
    
    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      owner: req.user._id
    });
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found or unauthorized' });
    }
    
    const menuItem = new MenuItem({
      name,
      description,
      restaurant: restaurantId,
      price,
      category,
      isVegetarian: isVegetarian || false
    });
    
    await menuItem.save();
    
    res.status(201).json({
      message: 'Menu item created successfully',
      menuItem
    });
  } catch (error) {
    next(error);
  }
};

const updateMenuItem = async (req, res, next) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id).populate('restaurant');
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    if (menuItem.restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const { name, description, price, category, isVegetarian, isAvailable } = req.body;
    
    Object.assign(menuItem, {
      name: name || menuItem.name,
      description: description || menuItem.description,
      price: price !== undefined ? price : menuItem.price,
      category: category || menuItem.category,
      isVegetarian: isVegetarian !== undefined ? isVegetarian : menuItem.isVegetarian,
      isAvailable: isAvailable !== undefined ? isAvailable : menuItem.isAvailable
    });
    
    await menuItem.save();
    
    res.json({ message: 'Menu item updated successfully', menuItem });
  } catch (error) {
    next(error);
  }
};

const deleteMenuItem = async (req, res, next) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id).populate('restaurant');
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    if (menuItem.restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    await MenuItem.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const getMyMenuItems = async (req, res, next) => {
  try {
    const restaurants = await Restaurant.find({ owner: req.user._id });
    const restaurantIds = restaurants.map(r => r._id);
    
    const menuItems = await MenuItem.find({ 
      restaurant: { $in: restaurantIds } 
    })
      .populate('restaurant', 'name')
      .sort({ category: 1, name: 1 });
    
    res.json({ menuItems });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getMyMenuItems
};