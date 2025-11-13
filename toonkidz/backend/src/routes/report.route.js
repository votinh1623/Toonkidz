// backend/src/routes/report.routes.js
import express from 'express';
import { createReport, getAllReports, updateReportStatus } from '../controllers/report.controller.js';
import { auth, adminAuth } from '../middleware/auth.middleware.js'

const router = express.Router();

router.post('/', auth, createReport);

router.get('/admin', auth, adminAuth, getAllReports);
router.put('/admin/:id', auth, adminAuth, updateReportStatus);

export default router;