const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  issue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
  previousStatus: { type: String, required: true },
  newStatus: { type: String, required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  note: { type: String, trim: true, default: '' },
  createdAt: { type: Date, default: Date.now }
});

statusHistorySchema.index({ issue: 1, createdAt: -1 });

module.exports = mongoose.model('StatusHistory', statusHistorySchema);