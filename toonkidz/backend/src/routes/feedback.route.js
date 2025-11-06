// backend/src/routes/feedback.route.js
import express from 'express';
import { auth, adminAuth } from '../middleware/auth.middleware.js';
import {
  postGuestFeedback,
  getAllFeedback,
  replyToFeedback
} from '../controllers/feedback.controller.js';

const router = express.Router();

router.post('/guest', postGuestFeedback);

router.route('/admin')
  .get(auth, adminAuth, getAllFeedback);

router.post('/admin/:id/reply', auth, adminAuth, replyToFeedback);

export default router;