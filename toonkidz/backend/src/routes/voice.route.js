// backend/routes/voice.route.js
import express from 'express';
import { 
    getVietnameseVoices, 
    getVoiceDetail, 
    getSuggestedVoices 
} from '../controllers/voice.controller.js';

const router = express.Router();

/**
 * @route   GET /api/voices/vi
 * @desc    Lấy danh sách tất cả giọng đọc tiếng Việt
 * @access  Public
 */
router.get('/vi', getVietnameseVoices);

/**
 * @route   GET /api/voices/vi/suggested
 * @desc    Lấy giọng đọc đề xuất dựa trên thể loại và độ tuổi
 * @query   theme - Thể loại truyện
 * @query   ageGroup - Độ tuổi mục tiêu
 * @access  Public
 */
router.get('/vi/suggested', getSuggestedVoices);

/**
 * @route   GET /api/voices/vi/:voiceId
 * @desc    Lấy thông tin chi tiết của một giọng đọc
 * @param   voiceId - ID của giọng đọc (ví dụ: vi-VN-HoaiMyNeural)
 * @access  Public
 */
router.get('/vi/:voiceId', getVoiceDetail);

export default router;