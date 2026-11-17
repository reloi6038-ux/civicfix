const Issue = require('../models/Issue');
const Category = require('../models/Category');
const StatusHistory = require('../models/StatusHistory');
const AppError = require('../utils/AppError');

const generateReference = async () => {
  const year = new Date().getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const startOfNextYear = new Date(year + 1, 0, 1);

  const count = await Issue.countDocuments({
    createdAt: { $gte: startOfYear, $lt: startOfNextYear }
  });

  return `CIV-${year}-${String(count + 1).padStart(5, '0')}`;
};

const createIssue = async (data, userId, photoPath) => {
  const category = await Category.findById(data.category);
  if (!category) throw new AppError('Category not found', 404);

  const reference = await generateReference();

  const issue = await Issue.create({
    title: data.title,
    description: data.description,
    category: data.category,
    location: data.location,
    address: data.address,
    city: data.city,
    state: data.state,
    country: data.country,
    latitude: data.latitude,
    longitude: data.longitude,
    priority: data.priority,
    reference,
    reporter: userId,
    photo: photoPath || null
  });

  await StatusHistory.create({
    issue: issue._id,
    previousStatus: 'NONE',
    newStatus: 'REPORTED',
    changedBy: userId,
    note: 'Issue reported'
  });

  return issue;
};

module.exports = { createIssue, generateReference };