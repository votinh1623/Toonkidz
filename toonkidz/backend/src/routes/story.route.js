// backend/routes/story.route.js

import express from 'express';
import { generateImagesForStory } from '../controllers/image.controller.js';
import {
  generateStory,
  createStory,
  getAllStories,
  getStoryById,
  updateStory,
  deleteStory,
  getMyStories,
  getPublicStories,
  savePreviewStory // ADD THIS IMPORT
} from '../controllers/story.controller.js';
import { auth, adminAuth } from '../middleware/auth.middleware.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/generate', auth, generateStory);
router.post('/:storyId/save', auth, savePreviewStory); // ADD THIS ROUTE
router.get('/', auth, getAllStories);
router.post('/create', auth, upload.any(), adminAuth, createStory);
router.get('/my-stories', auth, getMyStories);
router.get('/public', auth, getPublicStories);
router.post('/:storyId/generate-images', auth, generateImagesForStory);
router
  .route('/:id')
  .get(auth, getStoryById)
  .put(auth, upload.any(), updateStory)
  .delete(auth, deleteStory);

export default router;