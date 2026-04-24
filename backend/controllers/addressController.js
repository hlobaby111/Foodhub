const User = require('../models/User');

const getSavedAddresses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('savedAddresses');
    res.json({ addresses: user.savedAddresses || [] });
  } catch (error) { next(error); }
};

const addAddress = async (req, res, next) => {
  try {
    const { label, street, city, state, pincode, lat, lng, isDefault } = req.body;
    if (!street || !city) return res.status(400).json({ message: 'Street and city are required' });

    const user = await User.findById(req.user._id);
    if (isDefault) {
      user.savedAddresses.forEach(a => a.isDefault = false);
    }
    user.savedAddresses.push({ label: label || 'Home', street, city, state, pincode, lat, lng, isDefault: isDefault || user.savedAddresses.length === 0 });
    await user.save();
    res.json({ message: 'Address added', addresses: user.savedAddresses });
  } catch (error) { next(error); }
};

const updateAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const { label, street, city, state, pincode, lat, lng, isDefault } = req.body;
    const user = await User.findById(req.user._id);
    const addr = user.savedAddresses.id(addressId);
    if (!addr) return res.status(404).json({ message: 'Address not found' });

    if (isDefault) user.savedAddresses.forEach(a => a.isDefault = false);
    Object.assign(addr, { label: label || addr.label, street: street || addr.street, city: city || addr.city, state: state || addr.state, pincode: pincode || addr.pincode, lat: lat ?? addr.lat, lng: lng ?? addr.lng, isDefault: isDefault ?? addr.isDefault });
    await user.save();
    res.json({ message: 'Address updated', addresses: user.savedAddresses });
  } catch (error) { next(error); }
};

const deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.savedAddresses = user.savedAddresses.filter(a => a._id.toString() !== req.params.addressId);
    await user.save();
    res.json({ message: 'Address deleted', addresses: user.savedAddresses });
  } catch (error) { next(error); }
};

const updateCurrentLocation = async (req, res, next) => {
  try {
    const { lat, lng, label } = req.body;
    const update = { currentLocation: { lat, lng, updatedAt: new Date() } };
    if (label) update.lastLocationLabel = label;
    await User.findByIdAndUpdate(req.user._id, update);
    res.json({ message: 'Location updated' });
  } catch (error) { next(error); }
};

module.exports = { getSavedAddresses, addAddress, updateAddress, deleteAddress, updateCurrentLocation };
