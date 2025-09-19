import express from 'express';
import { getVietnameseWords } from '../controllers/viet.words.controller.js';

const router = express.Router();

// GET /api/vie-words/:theme
router.get('/:theme', getVietnameseWords);

export default router;
