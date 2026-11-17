const Comment = require('../models/Comment');
const Issue = require('../models/Issue');
const AppError = require('../utils/AppError');
const { createNotification } = require('../services/notificationService');

const addComment = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return next(new AppError('Issue not found', 404));

    const isOfficial = ['moderator', 'admin'].includes(req.user.role);

    const comment = await Comment.create({
      issue: issue._id,
      author: req.user._id,
      body: req.body.body,
      isOfficial
    });

    issue.commentCount = await Comment.countDocuments({ issue: issue._id, isDeleted: false });
    await issue.save();

    if (String(issue.reporter) !== String(req.user._id)) {
      await createNotification({
        recipient: issue.reporter,
        issue: issue._id,
        type: isOfficial ? 'OFFICIAL_RESPONSE' : 'COMMENT',
        title: isOfficial ? 'Official response on your issue' : 'New comment on your issue',
        message: `${req.user.name} commented on ${issue.reference}`
      });
    }

    const followerRecipients = issue.followers.filter(
      (fid) =>
        String(fid) !== String(req.user._id) &&
        String(fid) !== String(issue.reporter)
    );

    if (followerRecipients.length > 0) {
      await Promise.all(
        followerRecipients.map((fid) =>
          createNotification({
            recipient: fid,
            issue: issue._id,
            type: isOfficial ? 'OFFICIAL_RESPONSE' : 'COMMENT',
            title: `New comment on ${issue.reference}`,
            message: `${req.user.name} commented on an issue you follow`
          })
        )
      );
    }

    const populated = await comment.populate('author', 'name role');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

const getComments = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return next(new AppError('Issue not found', 404));

    const comments = await Comment.find({ issue: issue._id, isDeleted: false })
      .populate('author', 'name role')
      .sort({ createdAt: 1 });

    res.json({ success: true, count: comments.length, data: comments });
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return next(new AppError('Comment not found', 404));

    const isOwner = String(comment.author) === String(req.user._id);
    const isModerator = ['moderator', 'admin'].includes(req.user.role);

    if (!isOwner && !isModerator) {
      return next(new AppError('You cannot delete this comment', 403));
    }

    comment.isDeleted = true;
    await comment.save();

    const issue = await Issue.findById(comment.issue);
    if (issue) {
      issue.commentCount = await Comment.countDocuments({
        issue: issue._id,
        isDeleted: false
      });
      await issue.save();
    }

    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { addComment, getComments, deleteComment };