const Issue = require('../models/Issue');
const StatusHistory = require('../models/StatusHistory');
const AppError = require('../utils/AppError');
const { createNotification, createBulkNotifications } = require('../services/notificationService');
const { logAction } = require('../services/auditService');

/**
 * GET /api/moderator/issues
 * Same filters as public list but includes every status (even REJECTED/DUPLICATE).
 */
const listIssuesForModeration = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      city,
      state,
      keyword
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (city) filter.city = city.toLowerCase();
    if (state) filter.state = state.toLowerCase();
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
 * PATCH /api/moderator/issues/:id/priority
 */
const setPriority = async (req, res, next) => {
  try {
    const { priority } = req.body;
    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      { priority, updatedAt: new Date() },
      { returnDocument: 'after', runValidators: true }
    );
    if (!issue) return next(new AppError('Issue not found', 404));

    await logAction({
      user: req.user._id,
      action: 'ISSUE_PRIORITY_CHANGED',
      resource: 'Issue',
      resourceId: issue._id,
      description: `Priority set to ${priority} on ${issue.reference}`,
      ip: req.ip
    });

    res.json({ success: true, data: issue });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/moderator/issues/:id/official-response
 * Stores an official response and posts it as an official comment.
 */
const addOfficialResponse = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || message.trim().length < 3) {
      return next(new AppError('Official response must be at least 3 characters', 422));
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) return next(new AppError('Issue not found', 404));

    issue.officialResponse = message.trim();
    issue.updatedAt = new Date();
    await issue.save();

    // Mirror to comments as an "official" comment so the community sees it
    const Comment = require('../models/Comment');
    await Comment.create({
      issue: issue._id,
      author: req.user._id,
      body: message.trim(),
      isOfficial: true
    });
    issue.commentCount = await Comment.countDocuments({ issue: issue._id, isDeleted: false });
    await issue.save();

    // Notify reporter + followers
    if (String(issue.reporter) !== String(req.user._id)) {
      await createNotification({
        recipient: issue.reporter,
        issue: issue._id,
        type: 'OFFICIAL_RESPONSE',
        title: `Official response on ${issue.reference}`,
        message: `${req.user.name} posted an official response`
      });
    }
    await createBulkNotifications({
      recipients: issue.followers,
      actorId: req.user._id,
      issue: issue._id,
      type: 'OFFICIAL_RESPONSE',
      title: `Official response on ${issue.reference}`,
      message: `${req.user.name} posted an official response`
    });

    await logAction({
      user: req.user._id,
      action: 'ISSUE_OFFICIAL_RESPONSE_ADDED',
      resource: 'Issue',
      resourceId: issue._id,
      description: `Official response on ${issue.reference}`,
      ip: req.ip
    });

    res.json({ success: true, data: issue });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/moderator/issues/:id/verify
 * Convenience endpoint — sets status VERIFIED and records history.
 */
const verifyIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return next(new AppError('Issue not found', 404));
    if (issue.status === 'VERIFIED') {
      return next(new AppError('Issue is already verified', 409));
    }

    const previousStatus = issue.status;
    issue.status = 'VERIFIED';
    issue.updatedAt = new Date();
    await issue.save();

    await StatusHistory.create({
      issue: issue._id,
      previousStatus,
      newStatus: 'VERIFIED',
      changedBy: req.user._id,
      note: req.body.note || 'Verified by moderator'
    });

    await createBulkNotifications({
      recipients: issue.followers,
      actorId: req.user._id,
      issue: issue._id,
      type: 'VERIFICATION',
      title: `Issue ${issue.reference} verified`,
      message: 'A moderator verified this report'
    });

    if (String(issue.reporter) !== String(req.user._id)) {
      await createNotification({
        recipient: issue.reporter,
        issue: issue._id,
        type: 'VERIFICATION',
        title: `Your issue ${issue.reference} was verified`,
        message: 'A moderator verified your report'
      });
    }

    await logAction({
      user: req.user._id,
      action: 'ISSUE_VERIFIED',
      resource: 'Issue',
      resourceId: issue._id,
      description: `Verified ${issue.reference}`,
      ip: req.ip
    });

    res.json({ success: true, data: issue });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/moderator/issues/:id/reject
 */
const rejectIssue = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason || reason.trim().length < 3) {
      return next(new AppError('Rejection reason is required (min 3 chars)', 422));
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) return next(new AppError('Issue not found', 404));

    const previousStatus = issue.status;
    issue.status = 'REJECTED';
    issue.updatedAt = new Date();
    await issue.save();

    await StatusHistory.create({
      issue: issue._id,
      previousStatus,
      newStatus: 'REJECTED',
      changedBy: req.user._id,
      note: reason.trim()
    });

    if (String(issue.reporter) !== String(req.user._id)) {
      await createNotification({
        recipient: issue.reporter,
        issue: issue._id,
        type: 'STATUS_CHANGE',
        title: `Your issue ${issue.reference} was rejected`,
        message: reason.trim()
      });
    }

    await logAction({
      user: req.user._id,
      action: 'ISSUE_REJECTED',
      resource: 'Issue',
      resourceId: issue._id,
      description: `Rejected ${issue.reference}: ${reason.trim()}`,
      ip: req.ip
    });

    res.json({ success: true, data: issue });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/moderator/issues/:id/duplicate
 * Body: { duplicateOf: <ObjectId of the original issue> }
 */
const markDuplicate = async (req, res, next) => {
  try {
    const { duplicateOf } = req.body;
    if (!duplicateOf) return next(new AppError('duplicateOf (original issue ID) is required', 422));

    const original = await Issue.findById(duplicateOf);
    if (!original) return next(new AppError('Original issue not found', 404));

    const issue = await Issue.findById(req.params.id);
    if (!issue) return next(new AppError('Issue not found', 404));
    if (String(issue._id) === String(original._id)) {
      return next(new AppError('An issue cannot be a duplicate of itself', 422));
    }

    const previousStatus = issue.status;
    issue.status = 'DUPLICATE';
    issue.updatedAt = new Date();
    await issue.save();

    await StatusHistory.create({
      issue: issue._id,
      previousStatus,
      newStatus: 'DUPLICATE',
      changedBy: req.user._id,
      note: `Marked duplicate of ${original.reference}`
    });

    if (String(issue.reporter) !== String(req.user._id)) {
      await createNotification({
        recipient: issue.reporter,
        issue: issue._id,
        type: 'STATUS_CHANGE',
        title: `Your issue ${issue.reference} was marked duplicate`,
        message: `Duplicate of ${original.reference}`
      });
    }

    await logAction({
      user: req.user._id,
      action: 'ISSUE_MARKED_DUPLICATE',
      resource: 'Issue',
      resourceId: issue._id,
      description: `${issue.reference} marked duplicate of ${original.reference}`,
      ip: req.ip
    });

    res.json({ success: true, data: issue, duplicateOf: { _id: original._id, reference: original.reference } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listIssuesForModeration,
  setPriority,
  addOfficialResponse,
  verifyIssue,
  rejectIssue,
  markDuplicate
};