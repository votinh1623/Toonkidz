import express from "express";
import ImageService from "../services/imageService.js";
import contentFilter from "../middleware/contentFilter.js";

const router = express.Router();

router.post("/generate-image", contentFilter, async (req, res) => {
  try {
    console.log("Request body:", req.body);
    const { prompt, steps, numImages, keywords } = req.body;
    const result = await ImageService.generateImage(prompt, steps, numImages, keywords);
    res.json(result);
  } catch (error) {
    console.error("Error in image generation:", error);
    res.status(500).json({
      error: error.message || "Failed to generate image",
    });
  }
});

export default router;
