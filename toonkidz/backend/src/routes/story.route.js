// backend/routes/story.route.js

import express from 'express';
import {
  generateStory,
  createStory,
  getAllStories,
  getStoryById,
  updateStory,
  deleteStory
} from '../controllers/story.controller.js';
import { auth, adminAuth } from '../middleware/auth.middleware.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/generate', auth, generateStory);
router.get('/', auth, getAllStories);
router.post('/create', auth, upload.any(), adminAuth, createStory);

router
  .route('/:id')
  .get(auth, getStoryById)
  .put(auth, upload.any(), updateStory)
  .delete(auth, deleteStory);

export default router;