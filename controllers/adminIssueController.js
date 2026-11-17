const Issue = require('../models/Issue');
const Comment = require('../models/Comment');
const StatusHistory = require('../models/StatusHistory');
const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const { logAction } = require('../services/auditService');

/**
 * GET /api/admin/issues?page=&limit=&status=&priority=&city=&state=&keyword=&reporter=
 */
const listAllIssues = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      city,
      state,
      keyword,
      reporter
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (city) filter.city = city.toLowerCase();
    if (state) filter.state = state.toLowerCase();
    if (reporter) filter.reporter = reporter;
    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { reference: { $regex: keyword, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [issues, total] = await Promise.all([
      Issue.find(filter)
        .populate('category', 'name slug icon')
        .populate('reporter', 'name email')
        .sort('-createdAt')
        .skip(skip)
        .limit(limitNum),
      Issue.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: issues,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/issues/:id
 * Hard-deletes the issue and everything attached to it.
 * Use with caution — the audit log preserves the action.
 */
const deleteIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return next(new AppError('Issue not found', 404));

    await Promise.all([
      Comment.deleteMany({ issue: issue._id }),
      StatusHistory.deleteMany({ issue: issue._id }),
      Notification.deleteMany({ issue: issue._id })
    ]);

    await issue.deleteOne();

    await logAction({
      user: req.user._id,
      action: 'ISSUE_DELETED',
      resource: 'Issue',
      resourceId: issue._id,
      description: `Deleted ${issue.reference} — "${issue.title}"`,
      ip: req.ip
    });

    res.json({ success: true, message: 'Issue deleted permanently' });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/issues/:id/assign
 * Body: { moderatorId } — stored on issue for tracking.
 * Note: we store the assigned moderator in the audit log for now;
 * to display "Assigned to X" on the issue, add an `assignedTo` field to the Issue schema.
 */
const assignModerator = async (req, res, next) => {
  try {
    const { moderatorId } = req.body;
    if (!moderatorId) return next(new AppError('moderatorId is required', 422));

    const User = require('../models/User');
    const moderator = await User.findById(moderatorId);
    if (!moderator || !['moderator', 'admin'].includes(moderator.role)) {
      return next(new AppError('Target user is not a moderator', 400));
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) return next(new AppError('Issue not found', 404));

    await logAction({
      user: req.user._id,
      action: 'ISSUE_ASSIGNED',
      resource: 'Issue',
      resourceId: issue._id,
      description: `Assigned ${issue.reference} to ${moderator.email}`,
      ip: req.ip
    });

    // Notify the moderator
    await Notification.create({
      recipient: moderator._id,
      issue: issue._id,
      type: 'OFFICIAL_RESPONSE',
      title: `You have been assigned ${issue.reference}`,
      message: `Admin assigned you to issue: ${issue.title}`
    });

    res.json({ success: true, message: `Assigned to ${moderator.name}`, data: { issueId: issue._id, moderatorId: moderator._id } });
  } catch (error) {
    next(error);
  }
};

module.exports = { listAllIssues, deleteIssue, assignModerator };