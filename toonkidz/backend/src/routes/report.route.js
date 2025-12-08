import express from 'express';
import { createReport, getAllReports, updateReportStatus } from '../controllers/report.controller.js';
import { auth, adminAuth } from '../middleware/auth.middleware.js';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });

const router = express.Router();

router.post('/', auth, upload.array('evidence', 5), createReport);

router.get('/admin', auth, adminAuth, getAllReports);
router.put('/admin/:id', auth, adminAuth, updateReportStatus);

export default router;