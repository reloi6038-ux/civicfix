const Issue = require('../models/Issue');

/**
 * GET /api/admin/analytics
 * Single payload that powers all charts on the analytics page.
 */
const getAnalytics = async (req, res, next) => {
  try {
    // Issues by category
    const byCategory = await Issue.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
      { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, name: { $ifNull: ['$cat.name', 'Uncategorized'] }, icon: '$cat.icon', count: 1 } },
      { $sort: { count: -1 } }
    ]);

    // Issues by status
    const byStatus = await Issue.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', count: 1 } },
      { $sort: { count: -1 } }
    ]);

    // Top affected cities
    const byCity = await Issue.aggregate([
      { $group: { _id: { city: '$city', state: '$state' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, city: '$_id.city', state: '$_id.state', count: 1 } }
    ]);

    // Reports per month (last 12 months)
    const since = new Date();
    since.setMonth(since.getMonth() - 11);
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const byMonth = await Issue.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          count: 1
        }
      }
    ]);

    // Average resolution time (hours), for issues with resolvedAt set
    const avgResolution = await Issue.aggregate([
      { $match: { status: 'RESOLVED', resolvedAt: { $ne: null } } },
      { $project: { hours: { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 1000 * 60 * 60] } } },
      { $group: { _id: null, avgHours: { $avg: '$hours' } } }
    ]);

    const resolutionRate = await Issue.aggregate([
      { $group: { _id: null, total: { $sum: 1 }, resolved: { $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] } } } },
      { $project: { _id: 0, total: 1, resolved: 1, rate: { $cond: [{ $eq: ['$total', 0] }, 0, { $multiply: [{ $divide: ['$resolved', '$total'] }, 100] }] } } }
    ]);

    res.json({
      success: true,
      data: {
        byCategory,
        byStatus,
        byCity,
        byMonth,
        avgResolutionHours: avgResolution[0]?.avgHours
          ? Number(avgResolution[0].avgHours.toFixed(1))
          : null,
        resolutionRate: resolutionRate[0]
          ? Number(resolutionRate[0].rate.toFixed(1))
          : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAnalytics };