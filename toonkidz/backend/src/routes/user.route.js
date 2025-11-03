import express from 'express';
import { adminAuth, auth } from '../middleware/auth.middleware.js';
import {
  toggleFavoriteStory,
  getFavoriteStories,
  getUserById,
  updateProfile,
  changePassword,
  followUser,
  getProfile,
  getAllUsers,
  updateUserById,
  deleteUserById
} from '../controllers/user.controller.js';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.route('/')
  .get(auth, adminAuth, getAllUsers);

router.get('/profile', auth, getProfile);

router.put('/profile', auth, upload.single('pfp'), updateProfile);

router.post('/change-password', auth, changePassword);

router.get('/favorites', auth, getFavoriteStories);

router.post('/toggle-favorite/:storyId', auth, toggleFavoriteStory);

router.route('/:id')
  .get(auth, getUserById)
  .put(auth, adminAuth, updateUserById)
  .delete(auth, adminAuth, deleteUserById);

router.post('/:id/follow', auth, followUser);

export default router;