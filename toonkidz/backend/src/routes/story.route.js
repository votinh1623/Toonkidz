import express from 'express';
import { createStory, generateStory, getStory } from '../controllers/story.controller.js';
import { auth } from '../middleware/auth.middleware.js'; // Import the auth middleware
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

/**
 * POST /api/stories
 * Body: { theme: string, keywords: string[], prompt: string }
 * Response: { storyId, title, heading, pages, theme, keywords, model_used }
 */
router.post('/', auth, generateStory); // Add auth middleware here

/**
 * GET /api/stories/:storyId
 * Response: { story }
 */
router.get('/:storyId', auth, getStory); // Also protect the get route
router.post('/create', auth, upload.any(), createStory);

export default router;