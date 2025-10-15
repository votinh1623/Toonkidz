//image.route.js
const express = require('express');
const router = express.Router();
const ImageService = require('../services/imageService');
const contentFilter = require('../middleware/contentFilter');

// Image generation endpoint
router.post('/generate-image', contentFilter, async (req, res) => {
  try {
    console.log('Request body:', req.body); // <-- Add this for debugging
    const { prompt, steps, numImages, keywords } = req.body;
    const result = await ImageService.generateImage(prompt, steps, numImages, keywords);
    res.json(result);
  } catch (error) {
    console.error('Error in image generation:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate image'
    });
  }
});

module.exports = router;