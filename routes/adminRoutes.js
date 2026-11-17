const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const {
  mongoIdParam,
  updateRoleValidator,
  updateUserStatusValidator,
  adminIssueQueryValidator
} = require('../validators/adminValidators');

const { getAdminDashboard } = require('../controllers/adminDashboardController');
const { listUsers, getUserById, updateUserRole, updateUserStatus } = require('../controllers/adminUserController');
const { listAllIssues, deleteIssue, assignModerator } = require('../controllers/adminIssueController');
const { getAnalytics } = require('../controllers/analyticsController');
const { listAuditLogs } = require('../controllers/auditController');

router.use(protect, authorize('admin'));

// Dashboard
router.get('/dashboard', getAdminDashboard);

// Users
router.get('/users', listUsers);
router.get('/users/:id', mongoIdParam, validate, getUserById);
router.patch('/users/:id/role', updateRoleValidator, validate, updateUserRole);
router.patch('/users/:id/status', updateUserStatusValidator, validate, updateUserStatus);

// Issues
router.get('/issues', adminIssueQueryValidator, validate, listAllIssues);
router.delete('/issues/:id', mongoIdParam, validate, deleteIssue);
router.patch('/issues/:id/assign', mongoIdParam, validate, assignModerator);

// Analytics
router.get('/analytics', getAnalytics);

// Audit logs
router.get('/audit-logs', listAuditLogs);

module.exports = router;