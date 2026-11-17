const User = require('../models/User');
const Issue = require('../models/Issue');

/**
 * GET /api/admin/dashboard
 * Single endpoint that powers the admin overview page.
 */
const getAdminDashboard = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalIssues,
      reported,
      underReview,
      verified,
      inProgress,
      resolved,
      rejected,
      duplicate
    ] = await Promise.all([
      User.countDocuments(),
      Issue.countDocuments(),
      Issue.countDocuments({ status: 'REPORTED' }),
      Issue.countDocuments({ status: 'UNDER REVIEW' }),
      Issue.countDocuments({ status: 'VERIFIED' }),
      Issue.countDocuments({ status: 'IN PROGRESS' }),
      Issue.countDocuments({ status: 'RESOLVED' }),
      Issue.countDocuments({ status: 'REJECTED' }),
      Issue.countDocuments({ status: 'DUPLICATE' })
    ]);

    const resolutionRate =
      totalIssues > 0 ? Number(((resolved / totalIssues) * 100).toFixed(1)) : 0;

    const [recentUsers, recentIssues] = await Promise.all([
      User.find().sort('-createdAt').limit(5).select('name email role createdAt'),
      Issue.find()
        .sort('-createdAt')
        .limit(5)
        .populate('reporter', 'name')
        .select('reference title status createdAt reporter')
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalIssues,
          reported,
          underReview,
          verified,
          inProgress,
          resolved,
          rejected,
          duplicate,
          resolutionRate
        },
        recentUsers,
        recentIssues
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAdminDashboard };