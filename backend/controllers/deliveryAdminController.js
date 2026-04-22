const DeliveryPartner = require('../models/DeliveryPartner');
const User = require('../models/User');

exports.listPartners = async (req, res, next) => {
  try {
    const { status, kycStatus } = req.query;
    const q = {};
    if (status) q.status = status;
    if (kycStatus) q.kycStatus = kycStatus;

    const partners = await DeliveryPartner.find(q)
      .populate('user', 'name phone email isActive')
      .sort({ createdAt: -1 });
    res.json({ partners });
  } catch (e) { next(e); }
};

exports.getPartner = async (req, res, next) => {
  try {
    const partner = await DeliveryPartner.findById(req.params.id)
      .populate('user', 'name phone email isActive');
    if (!partner) return res.status(404).json({ message: 'Partner not found' });
    res.json({ partner });
  } catch (e) { next(e); }
};

exports.decideKyc = async (req, res, next) => {
  try {
    const { decision } = req.body; // 'verified' | 'rejected'
    if (!['verified', 'rejected'].includes(decision)) {
      return res.status(400).json({ message: 'Invalid decision' });
    }
    const partner = await DeliveryPartner.findById(req.params.id);
    if (!partner) return res.status(404).json({ message: 'Partner not found' });
    partner.kycStatus = decision;
    if (decision === 'verified') partner.status = 'active';
    await partner.save();
    res.json({ partner });
  } catch (e) { next(e); }
};

exports.togglePartner = async (req, res, next) => {
  try {
    const partner = await DeliveryPartner.findById(req.params.id);
    if (!partner) return res.status(404).json({ message: 'Partner not found' });
    partner.status = partner.status === 'active' ? 'inactive' : 'active';
    await partner.save();
    res.json({ partner });
  } catch (e) { next(e); }
};
