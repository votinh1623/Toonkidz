// backend/src/routes/post.route.js
import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
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
  sharePostToProfile
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

export default router;