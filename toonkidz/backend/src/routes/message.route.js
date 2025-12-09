// backend/src/routes/message.route.js
import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import { getMessages, sendMessageHTTP } from '../controllers/message.controller.js';

const router = express.Router();

router.get('/:conversationId', auth, getMessages);
router.post("/", auth, sendMessageHTTP);

export default router;