// backend/src/controllers/post.controller.js
import mongoose from 'mongoose';
import Post from '../models/post.model.js';
import Story from '../models/story.model.js';
import User from '../models/user.model.js';
import { createNotification } from './notification.controller.js';

const populateSharedPost = {
  path: 'originalPostId',
  populate: [
    { path: 'userId', select: 'name pfp' },
    { path: 'storyId' }
  ]
};

const populateComments = {
  path: 'comments',
  populate: { path: 'userId', select: 'name pfp' }
};

export const createPost = async (req, res) => {
  try {
    const { storyId, caption, visibility } = req.body;
    const userId = req.user._id;

    if (!storyId) {
      return res.status(400).json({ success: false, error: "Story ID is required" });
    }

    const newPost = new Post({
      userId,
      storyId,
      caption,
      visibility: visibility || 'public'
    });

    await newPost.save();
    await newPost.populate(['userId', 'storyId']);
    res.status(201).json({ success: true, post: newPost });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const sharePostToProfile = async (req, res) => {
  try {
    const { caption, visibility } = req.body;
    const originalPostId = req.params.id;
    const userId = req.user._id;

    const originalPost = await Post.findById(originalPostId);
    if (!originalPost) {
      return res.status(404).json({ success: false, error: "Bài viết gốc không tồn tại." });
    }

    originalPost.shares = (originalPost.shares || 0) + 1;

    const newSharedPost = new Post({
      userId,
      sharedCaption: caption,
      originalPostId: originalPostId,
      visibility: visibility || 'public',
      postType: 'share',
      // storyId: null,
      // caption: null,
    });

    await Promise.all([newSharedPost.save(), originalPost.save()]);
    const populatedPost = await Post.findById(newSharedPost._id)
      .populate('userId', 'name pfp')
      .populate(populateSharedPost);

    res.status(201).json({ success: true, post: populatedPost });

  } catch (error) {
    console.error("Error sharing post:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const currentUserId = req.user ? req.user._id : null;

    let query = { visibility: 'public' };
    let friendIds = [];

    if (currentUserId) {
      const currentUser = await User.findById(currentUserId);
      if (!currentUser) {
        return res.status(401).json({ success: false, error: "User not found" });
      }

      const followingIds = currentUser.following || [];
      const friends = await User.find({
        _id: { $in: followingIds },
        following: currentUserId
      }).select('_id');

      friendIds = friends.map(f => f._id.toString());
      friendIds.push(currentUserId.toString());

      query = {
        $and: [
          {
            $or: [
              { visibility: { $ne: 'private' } },
              { userId: currentUserId }
            ]
          },
          {
            $or: [
              { visibility: 'public' },
              { visibility: 'friend', userId: { $in: friendIds.map(id => new mongoose.Types.ObjectId(id)) } },
              { userId: currentUserId }
            ]
          }
        ]
      };
    }

    const posts = await Post.find(query)
      .populate('userId', 'name pfp')
      .populate('storyId')
      .populate(populateSharedPost)
      .populate(populateComments)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    const safePosts = posts.map(post => {
      if (post.postType !== 'share' || !post.originalPostId) {
        return post;
      }

      const originalPost = post.originalPostId;
      const originalAuthorId = originalPost.userId._id.toString();

      if (originalPost.visibility === 'public') {
        return post;
      }

      if (!currentUserId) {
        post.originalPostId = null;
        return post;
      }

      if (originalPost.visibility === 'private') {
        if (originalAuthorId !== currentUserId.toString()) {
          post.originalPostId = null;
        }
        return post;
      }
      if (originalPost.visibility === 'friend') {
        if (!friendIds.includes(originalAuthorId)) {
          post.originalPostId = null;
        }
        return post;
      }

      return post;
    });

    const totalPosts = await Post.countDocuments(query);

    res.json({
      success: true,
      posts: safePosts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit)
      }
    });
  } catch (error) {
    console.error("Error in getAllPosts:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPostsByUserId = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    let visibilityQuery = { visibility: 'public' };

    let friendIds = [];
    const currentUser = await User.findById(currentUserId).select('following');
    if (currentUser) {
      const followingIds = currentUser.following || [];
      const friends = await User.find({
        _id: { $in: followingIds },
        following: currentUserId
      }).select('_id');
      friendIds = friends.map(f => f._id.toString());
      friendIds.push(currentUserId.toString());
    }

    if (currentUserId.toString() === targetUserId.toString()) {
      visibilityQuery = {};
    } else {
      const targetUser = await User.findById(targetUserId).select('followers');
      if (!targetUser) {
        return res.status(404).json({ success: false, error: "User not found" });
      }

      const isFriend = targetUser.followers.includes(currentUserId) &&
        currentUser.following.includes(targetUserId);

      if (isFriend) {
        visibilityQuery = { visibility: { $in: ['public', 'friend'] } };
      }
    }

    const posts = await Post.find({ userId: targetUserId, ...visibilityQuery })
      .populate('userId', 'name pfp')
      .populate('storyId')
      .populate(populateSharedPost)
      .populate(populateComments)
      .sort({ createdAt: -1 })
      .lean();

    const safePosts = posts.map(post => {
      if (post.postType !== 'share' || !post.originalPostId) {
        return post;
      }

      const originalPost = post.originalPostId;
      const originalAuthorId = originalPost.userId._id.toString();

      if (originalPost.visibility === 'public') {
        return post;
      }
      if (originalPost.visibility === 'private') {
        if (originalAuthorId !== currentUserId.toString()) {
          post.originalPostId = null;
        }
        return post;
      }
      if (originalPost.visibility === 'friend') {
        if (!friendIds.includes(originalAuthorId)) {
          post.originalPostId = null;
        }
        return post;
      }

      return post;
    });

    res.json({ success: true, posts: safePosts });

  } catch (error) {
    console.error("Error in getPostsByUserId:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const likePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId).populate('userId', 'name pfp');

    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }
    if (!post.userId) {
      return res.status(404).json({ success: false, error: "Post author not found" });
    }

    const isOwner = post.userId._id.toString() === userId.toString();

    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
    } else {
      await Post.updateOne({ _id: postId }, { $addToSet: { likes: userId } });

      try {
        if (!isOwner) {
          await createNotification({
            recipientId: post.userId._id,
            senderId: userId,
            type: 'like_post',
            entityId: postId,
            message: `${req.user.name} đã thích bài đăng của bạn.`,
            targetUrl: `/home/profile/${post.userId._id}#${postId}`
          });
        }
      } catch (e) {
        console.error("Lỗi tạo thông báo Like:", e);
      }
    }

    const updatedPost = await Post.findById(postId);
    res.json({ success: true, likes: updatedPost.likes });
  } catch (error) {
    console.error("Error in likePost controller:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;
    const { text, rating } = req.body;

    if (!text || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: "Cần có nội dung và đánh giá (1-5 sao)." });
    }

    const post = await Post.findById(postId)
      .populate('userId', 'name')
      .populate(populateSharedPost);

    if (!post) {
      return res.status(404).json({ success: false, error: "Không tìm thấy bài đăng." });
    }
    if (!post.userId) {
      return res.status(404).json({ success: false, error: "Post author not found" });
    }

    post.comments.push({ userId, text, rating });
    await post.save();

    const storyIdToRate = post.originalPostId
      ? post.originalPostId.storyId
      : post.storyId;

    if (storyIdToRate) {
      await updateStoryRating(storyIdToRate);
    }

    try {
      if (post.userId._id.toString() !== userId.toString()) {
        await createNotification({
          recipientId: post.userId._id,
          senderId: userId,
          type: 'comment_post',
          entityId: post._id,
          message: `${req.user.name} đã bình luận: "${text.substring(0, 30)}..."`,
          targetUrl: `/home/profile/${post.userId._id}#${postId}`
        });
      }
    } catch (e) {
      console.error("Lỗi tạo thông báo Comment:", e);
    }

    const updatedPost = await Post.findById(postId)
      .populate('userId', 'name pfp')
      .populate('storyId')
      .populate(populateSharedPost)
      .populate(populateComments);

    res.status(201).json({ success: true, post: updatedPost });

  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateStoryRating = async (storyId) => {
  if (!storyId) return;

  const story = await Story.findById(storyId);
  if (!story) return;

  const originalPost = await Post.findOne({
    storyId: new mongoose.Types.ObjectId(storyId),
    postType: 'original'
  }).select('_id');
  if (!originalPost) {
    story.ratingAvg = 0;
    story.ratingCount = 0;
    await story.save();
    return;
  }

  const originalPostId = originalPost._id;

  const stats = await Post.aggregate([
    {
      $match: {
        $or: [
          { _id: originalPostId },
          { originalPostId: originalPostId }
        ]
      }
    },
    { $unwind: '$comments' },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$comments.rating' },
        ratingCount: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    story.ratingAvg = stats[0].averageRating;
    story.ratingCount = stats[0].ratingCount;
  } else {
    story.ratingAvg = 0;
    story.ratingCount = 0;
  }

  await story.save();
};


export const editComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { text, rating } = req.body;

    const post = await Post.findById(postId).populate('originalPostId');
    if (!post) return res.status(404).json({ error: "Post not found" });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    if (comment.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Not authorized" });
    }

    comment.text = text;
    comment.rating = rating;
    await post.save();

    const storyIdToRate = post.originalPostId
      ? post.originalPostId.storyId
      : post.storyId;

    if (storyIdToRate) {
      await updateStoryRating(storyIdToRate);
    }

    const updatedPost = await Post.findById(postId)
      .populate('userId', 'name pfp')
      .populate('storyId')
      .populate(populateSharedPost)
      .populate(populateComments);

    res.json({ success: true, post: updatedPost });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    const post = await Post.findById(postId).populate('originalPostId');
    if (!post) return res.status(404).json({ error: "Post not found" });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    if (comment.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Not authorized" });
    }

    post.comments.pull({ _id: commentId });
    await post.save();

    const storyIdToRate = post.originalPostId
      ? post.originalPostId.storyId
      : post.storyId;

    if (storyIdToRate) {
      await updateStoryRating(storyIdToRate);
    }

    const updatedPost = await Post.findById(postId)
      .populate('userId', 'name pfp')
      .populate('storyId')
      .populate(populateSharedPost)
      .populate(populateComments);

    res.json({ success: true, post: updatedPost });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { caption, visibility } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ success: false, error: "Post not found" });
    if (post.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    if (post.originalPostId) {
      post.sharedCaption = caption || post.sharedCaption;
    } else {
      post.caption = caption || post.caption;
    }
    post.visibility = visibility || post.visibility;
    await post.save();

    await post.populate(['userId', 'storyId', populateSharedPost]);

    res.json({ success: true, post });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ success: false, error: "Post not found" });
    if (post.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    if (post.originalPostId) {
      await Post.updateOne(
        { _id: post.originalPostId },
        { $inc: { shares: -1 } }
      );
    }

    if (!post.originalPostId) {
      await Post.deleteMany({ originalPostId: post._id });
    }

    await post.deleteOne();
    res.json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};