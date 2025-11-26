// backend/controllers/voice.controller.js
import VIETNAMESE_VOICES from '../config/vn_voice_config.js';

/**
 * Lấy danh sách tất cả giọng đọc tiếng Việt
 */
export const getVietnameseVoices = (req, res) => {
    try {
        console.log('Fetching Vietnamese voices...');
        
        return res.json({
            success: true,
            count: Object.keys(VIETNAMESE_VOICES).length,
            voices: VIETNAMESE_VOICES
        });
    } catch (error) {
        console.error('Error in getVietnameseVoices:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

/**
 * Lấy thông tin chi tiết của một giọng đọc
 */
export const getVoiceDetail = (req, res) => {
    try {
        const { voiceId } = req.params;
        console.log(`Fetching voice detail for: ${voiceId}`);
        
        const voice = VIETNAMESE_VOICES[voiceId];
        
        if (!voice) {
            return res.status(404).json({
                success: false,
                error: 'Voice not found'
            });
        }
        
        return res.json({
            success: true,
            voice: {
                id: voiceId,
                ...voice
            }
        });
    } catch (error) {
        console.error('Error in getVoiceDetail:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

/**
 * Lấy giọng đọc đề xuất dựa trên thể loại truyện
 */
export const getSuggestedVoices = (req, res) => {
    try {
        const { theme, ageGroup } = req.query;
        console.log(`Getting suggested voices for theme: ${theme}, ageGroup: ${ageGroup}`);
        
        let suggestedVoices = { ...VIETNAMESE_VOICES };
        
        // Lọc theo thể loại nếu có
        if (theme) {
            const themePreferences = {
                'fairytale': ['female', 'child'],
                'adventure': ['male', 'young'],
                'animal': ['female', 'child'],
                'science': ['male', 'young'],
                'nature': ['female', 'young'],
                'music': ['female', 'young']
            };
            
            const preference = themePreferences[theme];
            if (preference) {
                const [preferredGender, preferredAge] = preference;
                suggestedVoices = Object.fromEntries(
                    Object.entries(VIETNAMESE_VOICES).filter(([_, voice]) => 
                        voice.gender === preferredGender && voice.age === preferredAge
                    )
                );
            }
        }
        
        // Lọc theo độ tuổi nếu có
        if (ageGroup) {
            const agePreferences = {
                '3-5': ['child', 'young'],
                '6-8': ['young'],
                '9-12': ['young', 'middle-aged']
            };
            
            const preferredAges = agePreferences[ageGroup];
            if (preferredAges) {
                suggestedVoices = Object.fromEntries(
                    Object.entries(suggestedVoices).filter(([_, voice]) => 
                        preferredAges.includes(voice.age)
                    )
                );
            }
        }
        
        return res.json({
            success: true,
            count: Object.keys(suggestedVoices).length,
            voices: suggestedVoices,
            filters: {
                theme,
                ageGroup
            }
        });
    } catch (error) {
        console.error('Error in getSuggestedVoices:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};