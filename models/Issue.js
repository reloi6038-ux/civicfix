const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  reference: { type: String, unique: true, required: true },
  title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 200 },
  description: { type: String, required: [true, 'Description is required'], maxlength: 5000 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['REPORTED', 'UNDER REVIEW', 'VERIFIED', 'IN PROGRESS', 'RESOLVED', 'REJECTED', 'DUPLICATE'],
    default: 'REPORTED'
  },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  location: { type: String, required: true, trim: true },
  address: { type: String, trim: true },
  city: { type: String, required: true, trim: true, lowercase: true },
  state: { type: String, required: true, trim: true, lowercase: true },
  country: { type: String, required: true, default: 'Nigeria', trim: true },
  latitude: { type: Number },
  longitude: { type: Number },
  photo: { type: String, default: null },
  officialResponse: { type: String, trim: true },
  resolutionNote: { type: String, trim: true },
  resolvedAt: { type: Date },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followerCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

issueSchema.index({ status: 1, createdAt: -1 });
issueSchema.index({ category: 1 });
issueSchema.index({ city: 1, state: 1 });
issueSchema.index({ reporter: 1 });

module.exports = mongoose.model('Issue', issueSchema);