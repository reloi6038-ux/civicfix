const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const {
  updatePriorityValidator,
  mongoIdParam
} = require('../validators/adminValidators');
const {
  listIssuesForModeration,
  setPriority,
  addOfficialResponse,
  verifyIssue,
  rejectIssue,
  markDuplicate
} = require('../controllers/moderatorController');

router.use(protect, authorize('moderator', 'admin'));

router.get('/issues', listIssuesForModeration);
router.patch('/issues/:id/priority', updatePriorityValidator, validate, setPriority);
router.post('/issues/:id/official-response', mongoIdParam, validate, addOfficialResponse);
router.post('/issues/:id/verify', mongoIdParam, validate, verifyIssue);
router.post('/issues/:id/reject', mongoIdParam, validate, rejectIssue);
router.post('/issues/:id/duplicate', mongoIdParam, validate, markDuplicate);

module.exports = router;