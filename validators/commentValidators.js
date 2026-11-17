const { body } = require('express-validator');

const createCommentValidator = [
  body('body')
    .trim()
    .notEmpty()
    .withMessage('Comment body is required')
    .isLength({ max: 2000 })
    .withMessage('Comment cannot exceed 2000 characters')
];

module.exports = { createCommentValidator };