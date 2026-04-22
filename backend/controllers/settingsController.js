const Settings = require('../models/Settings');

exports.getSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getSettings();
    res.json({ settings });
  } catch (e) { next(e); }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { key: 'global' },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json({ settings });
  } catch (e) { next(e); }
};

exports.pausePlatform = async (req, res, next) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { key: 'global' },
      {
        $set: {
          platformPaused: true,
          pauseReason: req.body.reason || 'Emergency pause',
          pausedAt: new Date(),
          pausedBy: req.userId
        }
      },
      { new: true, upsert: true }
    );
    res.json({ settings });
  } catch (e) { next(e); }
};

exports.resumePlatform = async (req, res, next) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { key: 'global' },
      { $set: { platformPaused: false, pauseReason: null, pausedAt: null, pausedBy: null } },
      { new: true, upsert: true }
    );
    res.json({ settings });
  } catch (e) { next(e); }
};
