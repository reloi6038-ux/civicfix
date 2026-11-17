const { body, param, query } = require('express-validator');

const mongoIdParam = [param('id').isMongoId().withMessage('Invalid ID')];

const updateRoleValidator = [
  ...mongoIdParam,
  body('role')
    .isIn(['resident', 'moderator', 'admin'])
    .withMessage('Role must be resident, moderator, or admin')
];

const updateUserStatusValidator = [
  ...mongoIdParam,
  body('isActive').isBoolean().withMessage('isActive must be true or false')
];

const updatePriorityValidator = [
  ...mongoIdParam,
  body('priority')
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Invalid priority')
];

const adminIssueQueryValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1–100')
];

module.exports = {
  mongoIdParam,
  updateRoleValidator,
  updateUserStatusValidator,
  updatePriorityValidator,
  adminIssueQueryValidator
};