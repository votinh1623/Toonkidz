// backend/src/routes/message.route.js
import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import { getMessages } from '../controllers/message.controller.js';

const router = express.Router();

router.get('/:conversationId', auth, getMessages);

export default router;