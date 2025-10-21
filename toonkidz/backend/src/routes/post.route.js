// backend/src/routes/post.route.js
import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import { createPost, getAllPosts, likePost, addComment, editComment, deleteComment, getPostsByUserId } from '../controllers/post.controller.js';

const router = express.Router();

router.route('/')
  .post(auth, createPost)
  .get(auth, getAllPosts);

router.route('/user/:userId')
  .get(auth, getPostsByUserId);

router.route('/:id/like')
  .post(auth, likePost);

router.route('/:postId/comment')
  .post(auth, addComment);

router.route('/:postId/comments/:commentId')
  .put(auth, editComment)
  .delete(auth, deleteComment);

export default router;