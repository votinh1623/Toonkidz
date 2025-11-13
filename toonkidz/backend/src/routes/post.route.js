// backend/src/routes/post.route.js
import express from 'express';
import { adminAuth, auth } from '../middleware/auth.middleware.js';
import {
  createPost,
  getAllPosts,
  likePost,
  addComment,
  editComment,
  deleteComment,
  getPostsByUserId,
  updatePost,
  deletePost,
  sharePostToProfile,
  adminDeleteComment
} from '../controllers/post.controller.js';

const router = express.Router();

router.get('/', auth, getAllPosts);

router.get('/user/:userId', auth, getPostsByUserId);

router.post('/', auth, createPost);

router.post('/:id/share', auth, sharePostToProfile);

router.route('/:id')
  .put(auth, updatePost)
  .delete(auth, deletePost);

router.post('/:id/like', auth, likePost);

router.post('/:postId/comment', auth, addComment);
router.put('/:postId/comment/:commentId', auth, editComment);
router.delete('/:postId/comment/:commentId', auth, deleteComment);

router.delete('/admin/:postId/comments/:commentId', auth, adminAuth, adminDeleteComment);

export default router;