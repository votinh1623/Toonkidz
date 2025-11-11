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
  postType: {
    type: String,
    enum: ['original', 'share'],
    required: true,
    default: 'original'
  },
  storyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Story',
    // required: true,
    required: function () { return this.postType === 'original'; }
  },
  caption: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  sharedCaption: {
    type: String,
    trim: true,
  },
  originalPostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: function () { return this.postType === 'share'; }
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  visibility: {
    type: String,
    enum: ['public', 'friend', 'private'],
    default: 'public'
  },
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