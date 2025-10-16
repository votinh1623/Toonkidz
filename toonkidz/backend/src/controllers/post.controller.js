// backend/src/controllers/post.controller.js
import mongoose from 'mongoose';
import Post from '../models/post.model.js';
import Story from '../models/story.model.js';

export const createPost = async (req, res) => {
  try {
    const { storyId, caption } = req.body;
    const userId = req.user._id;

    if (!storyId) {
      return res.status(400).json({ success: false, error: "Story ID is required" });
    }

    const newPost = new Post({
      userId,
      storyId,
      caption
    });

    await newPost.save();
    res.status(201).json({ success: true, post: newPost });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const posts = await Post.find({})
      .populate('userId', 'name pfp')
      .populate('storyId')
      .populate({
        path: 'comments',
        populate: {
          path: 'userId',
          select: 'name pfp'
        }
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalPosts = await Post.countDocuments();

    res.json({
      success: true,
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const likePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      // Bỏ thích
      await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
    } else {
      // Thích
      await Post.updateOne({ _id: postId }, { $addToSet: { likes: userId } });
    }

    const updatedPost = await Post.findById(postId);
    res.json({ success: true, likes: updatedPost.likes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateStoryRating = async (storyId) => {
  if (!storyId) return;
  const story = await Story.findById(storyId);
  if (!story) return;

  const stats = await Post.aggregate([
    { $match: { storyId: new mongoose.Types.ObjectId(storyId) } },
    { $unwind: '$comments' },
    {
      $group: {
        _id: '$storyId',
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

export const addComment = async (req, res) => {
  try {
    const { postId } = req.params; // Sửa `id` thành `postId` cho khớp với route
    const userId = req.user._id;
    const { text, rating } = req.body;

    if (!text || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: "Cần có nội dung và đánh giá (1-5 sao)." });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: "Không tìm thấy bài đăng." });
    }

    post.comments.push({ userId, text, rating });
    await post.save();

    await updateStoryRating(post.storyId);

    const updatedPost = await Post.findById(postId)
      .populate('userId', 'name pfp')
      .populate('storyId') // Populate lại story để lấy ratingAvg mới
      .populate({
        path: 'comments',
        populate: { path: 'userId', select: 'name pfp' }
      });

    res.status(201).json({ success: true, post: updatedPost });

  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const editComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { text, rating } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    if (comment.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Not authorized" });
    }

    comment.text = text;
    comment.rating = rating;
    await post.save();

    await updateStoryRating(post.storyId);

    const updatedPost = await Post.findById(postId)
      .populate('userId', 'name pfp') // Populate thêm userId
      .populate('storyId')
      .populate({ path: 'comments', populate: { path: 'userId', select: 'name pfp' } });

    res.json({ success: true, post: updatedPost });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    if (comment.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Not authorized" });
    }

    post.comments.pull({ _id: commentId });
    await post.save();

    await updateStoryRating(post.storyId);

    const updatedPost = await Post.findById(postId)
      .populate('userId', 'name pfp')
      .populate('storyId')
      .populate({ path: 'comments', populate: { path: 'userId', select: 'name pfp' } });

    res.json({ success: true, post: updatedPost });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};