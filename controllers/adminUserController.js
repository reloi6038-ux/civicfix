const User = require('../models/User');
const Issue = require('../models/Issue');
const AppError = require('../utils/AppError');
const { logAction } = require('../services/auditService');

/**
 * GET /api/admin/users?role=&search=&isActive=&page=&limit=
 */
const listUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search, isActive } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(filter).sort('-createdAt').skip(skip).limit(limitNum),
      User.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: users,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError('User not found', 404));

    const issues = await Issue.find({ reporter: user._id })
      .sort('-createdAt')
      .limit(20)
      .populate('category', 'name icon')
      .select('reference title status createdAt category');

    res.json({ success: true, data: { user, issues } });
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    // Guardrail: admins cannot change their own role
    if (String(req.user._id) === String(req.params.id)) {
      return next(new AppError('You cannot change your own role', 400));
    }

    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError('User not found', 404));

    const oldRole = user.role;
    user.role = role;
    await user.save();

    await logAction({
      user: req.user._id,
      action: 'USER_ROLE_CHANGED',
      resource: 'User',
      resourceId: user._id,
      description: `Changed ${user.email} from ${oldRole} to ${role}`,
      ip: req.ip
    });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;

    if (String(req.user._id) === String(req.params.id) && isActive === false) {
      return next(new AppError('You cannot deactivate your own account', 400));
    }

    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError('User not found', 404));

    user.isActive = isActive;
    await user.save();

    await logAction({
      user: req.user._id,
      action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      resource: 'User',
      resourceId: user._id,
      description: `${isActive ? 'Activated' : 'Deactivated'} ${user.email}`,
      ip: req.ip
    });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

module.exports = { listUsers, getUserById, updateUserRole, updateUserStatus };