const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const validate = require('../middleware/validateMiddleware');
const { createIssueValidator } = require('../validators/issueValidators');
const {
  createIssue,
  getIssues,
  getIssueById,
  updateStatus,
  getDashboardStats,
  followIssue,
  unfollowIssue,
  getFollowedIssues
} = require('../controllers/issueController');
const { issueCommentRouter } = require('./commentRoutes');

router.get('/dashboard/stats', getDashboardStats);
router.get('/followed', protect, getFollowedIssues);
router.get('/', getIssues);
router.post('/', protect, upload.single('photo'), createIssueValidator, validate, createIssue);
router.post('/:id/follow', protect, followIssue);
router.delete('/:id/follow', protect, unfollowIssue);
router.use('/:id/comments', issueCommentRouter);
router.get('/:id', getIssueById);
router.patch('/:id/status', protect, authorize('moderator', 'admin'), updateStatus);

module.exports = router;