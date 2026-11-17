const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  issue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: [true, 'Comment body is required'], trim: true, maxlength: 2000 },
  isOfficial: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

commentSchema.index({ issue: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);