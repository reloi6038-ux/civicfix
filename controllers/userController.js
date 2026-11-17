const User = require('../models/User');
const Issue = require('../models/Issue');
const AppError = require('../utils/AppError');

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'phone', 'address', 'city', 'state', 'country'];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true
    });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    const match = await user.comparePassword(currentPassword);
    if (!match) return next(new AppError('Current password is incorrect', 401));

    if (!newPassword || newPassword.length < 8) {
      return next(new AppError('New password must be at least 8 characters', 422));
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

const getMyIssues = async (req, res, next) => {
  try {
    const issues = await Issue.find({ reporter: req.user._id })
      .populate('category', 'name slug icon')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: issues.length, data: issues });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile, changePassword, getMyIssues };