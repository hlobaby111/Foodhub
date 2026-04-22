const Offer = require('../models/Offer');

exports.createOffer = async (req, res, next) => {
  try {
    const offer = await Offer.create({ ...req.body, createdBy: req.userId });
    res.status(201).json({ offer });
  } catch (e) { next(e); }
};

exports.listOffers = async (req, res, next) => {
  try {
    const { status } = req.query;
    const q = {};
    if (status === 'active') q.isActive = true;
    if (status === 'paused') q.isActive = false;
    const offers = await Offer.find(q).sort({ createdAt: -1 });
    res.json({ offers });
  } catch (e) { next(e); }
};

exports.updateOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!offer) return res.status(404).json({ message: 'Offer not found' });
    res.json({ offer });
  } catch (e) { next(e); }
};

exports.toggleOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });
    offer.isActive = !offer.isActive;
    await offer.save();
    res.json({ offer });
  } catch (e) { next(e); }
};

exports.deleteOffer = async (req, res, next) => {
  try {
    await Offer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Offer deleted' });
  } catch (e) { next(e); }
};
