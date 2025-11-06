import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import { getNotifications, markAllRead, markOneRead } from '../controllers/notification.controller.js';

const router = express.Router();

router.get('/', auth, getNotifications);
router.post('/mark-all-read', auth, markAllRead);
router.post('/:notificationId/read', auth, markOneRead);

export default router;