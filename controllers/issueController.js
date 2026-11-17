const Issue = require('../models/Issue');
const Category = require('../models/Category');
const StatusHistory = require('../models/StatusHistory');
const issueService = require('../services/issueService');
const { createNotification, createBulkNotifications } = require('../services/notificationService');
const AppError = require('../utils/AppError');

const createIssue = async (req, res, next) => {
  try {
    const photoPath = req.file ? `/uploads/${req.file.filename}` : null;
    const issue = await issueService.createIssue(req.body, req.user._id, photoPath);
    res.status(201).json({ success: true, data: issue });
  } catch (error) {
    next(error);
  }
};

const getIssues = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      status,
      priority,
      city,
      state,
      keyword,
      sort = '-createdAt'
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (city) filter.city = city.toLowerCase();
    if (state) filter.state = state.toLowerCase();

    if (category) {
      const cat = await Category.findOne({ slug: category });
      if (cat) filter.category = cat._id;
    }

    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { reference: { $regex: keyword, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [issues, total] = await Promise.all([
      Issue.find(filter)
        .populate('category', 'name slug icon')
        .populate('reporter', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Issue.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: issues,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getIssueById = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('category', 'name slug icon')
      .populate('reporter', 'name email')
      .populate('followers', 'name');

    if (!issue) return next(new AppError('Issue not found', 404));

    const history = await StatusHistory.find({ issue: issue._id })
      .populate('changedBy', 'name role')
      .sort({ createdAt: 1 });

    res.json({ success: true, data: { issue, statusHistory: history } });
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['UNDER REVIEW', 'VERIFIED', 'IN PROGRESS', 'RESOLVED', 'REJECTED', 'DUPLICATE'];

    if (!validStatuses.includes(status)) {
      return next(new AppError('Invalid status', 422));
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) return next(new AppError('Issue not found', 404));

    const previousStatus = issue.status;
    issue.status = status;
    issue.updatedAt = new Date();
    if (status === 'RESOLVED') issue.resolvedAt = new Date();
    await issue.save();

    // Record status history (never overwritten)
    await StatusHistory.create({
      issue: issue._id,
      previousStatus,
      newStatus: status,
      changedBy: req.user._id,
      note: note || ''
    });

    // Notify all followers (excluding actor)
    await createBulkNotifications({
      recipients: issue.followers,
      actorId: req.user._id,
      issue: issue._id,
      type: 'STATUS_CHANGE',
      title: 'Issue status updated',
      message: `Issue ${issue.reference} is now ${status}`
    });

    // Notify reporter if they are not the actor
    if (String(issue.reporter) !== String(req.user._id)) {
      await createNotification({
        recipient: issue.reporter,
        issue: issue._id,
        type: 'STATUS_CHANGE',
        title: `Your issue ${issue.reference} was updated`,
        message: `Status changed from ${previousStatus} to ${status}`
      });
    }

    res.json({ success: true, data: issue });
  } catch (error) {
    next(error);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const [total, reported, underReview, inProgress, resolved] = await Promise.all([
      Issue.countDocuments(),
      Issue.countDocuments({ status: 'REPORTED' }),
      Issue.countDocuments({ status: 'UNDER REVIEW' }),
      Issue.countDocuments({ status: 'IN PROGRESS' }),
      Issue.countDocuments({ status: 'RESOLVED' })
    ]);

    const recentReports = await Issue.find()
      .populate('category', 'name icon')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('reference title status createdAt city');

    const popularCategories = await Issue.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      { $project: { name: '$category.name', icon: '$category.icon', count: 1 } }
    ]);

    const recentlyResolved = await Issue.find({ status: 'RESOLVED' })
      .sort({ resolvedAt: -1 })
      .limit(5)
      .select('reference title resolvedAt');

    res.json({
      success: true,
      data: {
        stats: { total, reported, underReview, inProgress, resolved },
        recentReports,
        popularCategories,
        recentlyResolved
      }
    });
  } catch (error) {
    next(error);
  }
};

// -------------------- Follow / Unfollow --------------------

const followIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return next(new AppError('Issue not found', 404));

    const alreadyFollowing = issue.followers.some(
      (fid) => String(fid) === String(req.user._id)
    );

    if (!alreadyFollowing) {
      issue.followers.push(req.user._id);
      issue.followerCount = issue.followers.length;
      await issue.save();
    }

    res.json({
      success: true,
      message: alreadyFollowing ? 'Already following' : 'Now following issue',
      data: { followerCount: issue.followerCount, isFollowing: true }
    });
  } catch (error) {
    next(error);
  }
};

const unfollowIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return next(new AppError('Issue not found', 404));

    issue.followers = issue.followers.filter(
      (fid) => String(fid) !== String(req.user._id)
    );
    issue.followerCount = issue.followers.length;
    await issue.save();

    res.json({
      success: true,
      message: 'Unfollowed',
      data: { followerCount: issue.followerCount, isFollowing: false }
    });
  } catch (error) {
    next(error);
  }
};

const getFollowedIssues = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '10', 10)));
    const skip = (page - 1) * limit;

    const filter = { followers: req.user._id };

    const [issues, total] = await Promise.all([
      Issue.find(filter)
        .populate('category', 'name slug icon')
        .sort('-updatedAt')
        .skip(skip)
        .limit(limit),
      Issue.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: issues,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createIssue,
  getIssues,
  getIssueById,
  updateStatus,
  getDashboardStats,
  followIssue,
  unfollowIssue,
  getFollowedIssues
};