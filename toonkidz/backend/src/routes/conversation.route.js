// backend/src/routes/conversation.route.js
import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import { getConversations, findOrCreateConversation } from '../controllers/conversation.controller.js';

const router = express.Router();

router.get('/', auth, getConversations);
router.post('/findOrCreate', auth, findOrCreateConversation);

export default router;