// backend/src/routes/user.route.js
import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import {
  toggleFavoriteStory,
  getFavoriteStories,
  getUserById,
  updateProfile,
  changePassword,
  followUser,
  getProfile
} from '../controllers/user.controller.js';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.get('/profile', auth, getProfile);
router.put('/profile', auth, upload.single('pfp'), updateProfile);
router.post('/change-password', auth, changePassword);

router.get('/favorites', auth, getFavoriteStories);
router.post('/toggle-favorite/:storyId', auth, toggleFavoriteStory);

router.get('/:id', auth, getUserById);
router.post('/:id/follow', auth, followUser);

export default router;