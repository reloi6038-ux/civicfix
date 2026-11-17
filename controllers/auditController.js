const AuditLog = require('../models/AuditLog');

const listAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, resource, action, userId } = req.query;

    const filter = {};
    if (resource) filter.resource = resource;
    if (action) filter.action = action;
    if (userId) filter.user = userId;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('user', 'name email role')
        .sort('-createdAt')
        .skip(skip)
        .limit(limitNum),
      AuditLog.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { listAuditLogs };