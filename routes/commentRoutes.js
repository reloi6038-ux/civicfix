const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { createCommentValidator } = require('../validators/commentValidators');
const { addComment, getComments, deleteComment } = require('../controllers/commentController');

const issueCommentRouter = express.Router({ mergeParams: true });
issueCommentRouter.get('/', getComments);
issueCommentRouter.post('/', protect, createCommentValidator, validate, addComment);

const commentRouter = express.Router();
commentRouter.delete('/:id', protect, deleteComment);

module.exports = { issueCommentRouter, commentRouter };