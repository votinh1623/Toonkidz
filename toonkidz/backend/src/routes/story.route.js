import express from 'express';
import { generateStory, getStory } from '../controllers/story.controller.js';
import { auth } from '../middleware/auth.middleware.js'; // Import the auth middleware

const router = express.Router();

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

export default router;