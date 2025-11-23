import express from 'express';
import { auth, adminAuth } from '../middleware/auth.middleware.js';
import { getDashboardStats } from '../controllers/dashboard.controller.js';

const router = express.Router();

router.get('/stats', auth, adminAuth, getDashboardStats);

export default router;