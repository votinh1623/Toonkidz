// backend/src/models/post.model.js

import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  storyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Story',
    required: true,
  },
  caption: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [commentSchema],
  shares: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index để tối ưu truy vấn
postSchema.index({ createdAt: -1 });

const Post = mongoose.model('Post', postSchema);

export default Post;