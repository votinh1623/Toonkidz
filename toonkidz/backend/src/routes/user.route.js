// backend/src/routes/user.route.js
import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import { toggleFavoriteStory, getFavoriteStories } from '../controllers/user.controller.js';

const router = express.Router();

router.post('/toggle-favorite/:storyId', auth, toggleFavoriteStory);
router.get('/favorites', auth, getFavoriteStories);

export default router;