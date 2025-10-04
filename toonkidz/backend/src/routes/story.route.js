import express from 'express';
import { generateStory } from '../controllers/story.controller.js';

const router = express.Router();

/**
 * POST /api/stories
 * Body: { theme: string, keywords: string[] }
 * Response: { title, head, content }
 */
router.post('/', generateStory);

export default router;
