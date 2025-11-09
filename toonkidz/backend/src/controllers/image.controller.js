// image.controller.js
import Replicate from "replicate";
import { writeFile } from "fs/promises";
import fs from "fs";
import path from "path";
import Story from '../models/story.model.js';
import cloudinary from "../lib/cloudinary.js";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY, // FIXED: Changed from TOKEN to KEY
});

export const generateImagesForStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { coverImagePrompt, pages } = req.body;

    // Get the story
    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    console.log('Starting image generation for story:', storyId);

    // Generate cover image
    console.log('Generating cover image...');
    const coverImageUrl = await generateImageWithFlux(coverImagePrompt);
    
    // Generate images for each page
    console.log('Generating page images...');
    const pagesWithImages = await Promise.all(
      pages.map(async (page) => {
        const imageUrl = await generateImageWithFlux(page.prompt);
        return {
          pageNumber: page.pageNumber,
          image: imageUrl
        };
      })
    );

    // Update story with generated images
    story.coverImage = coverImageUrl;
    story.pages = story.pages.map(page => {
      const pageWithImage = pagesWithImages.find(p => p.pageNumber === page.pageNumber);
      return {
        ...page.toObject(),
        image: pageWithImage ? pageWithImage.image : ''
      };
    });
    story.status = 'completed';

    await story.save();

    console.log('Story completed with images:', storyId);

    res.json({
      success: true,
      message: 'All images generated successfully',
      story: {
        id: story._id,
        title: story.title,
        coverImage: story.coverImage,
        pages: story.pages
      }
    });

  } catch (error) {
    console.error('Error generating images:', error);
    res.status(500).json({ error: 'Failed to generate images: ' + error.message });
  }
};

// Image generation function with Replicate Flux Schnell
const generateImageWithFlux = async (prompt) => {
  // Enhance the prompt for better results
  const enhancedPrompt = `${prompt}, cartoon style, children's book illustration, bright vibrant colors, friendly characters, detailed, 4k, professional artwork`;
  
  console.log('Generating image with prompt:', enhancedPrompt);
  
  // Check if we have Replicate API key
  if (!process.env.REPLICATE_API_KEY) { // FIXED: Changed from TOKEN to KEY
    throw new Error('Replicate API key not configured');
  }

  try {
    const input = {
      prompt: enhancedPrompt,
      go_fast: true,
      megapixels: "1",
      num_outputs: 1,
      aspect_ratio: "1:1",
      output_format: "webp",
      output_quality: 80,
      num_inference_steps: 4
    };

    console.log('Calling Replicate API with input:', input);
    
    const output = await replicate.run("black-forest-labs/flux-schnell", { input });
    
    console.log('Replicate output received:', output);
    
    if (!output || !output[0]) {
      throw new Error('No output received from Replicate');
    }

    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Generate unique filename
    const filename = `story_${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
    const filePath = path.join(tempDir, filename);
    
    // Write file to disk
    console.log('Writing file to disk:', filePath);
    await writeFile(filePath, output[0]);
    console.log('Image saved to disk');
    
    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary([filename], tempDir);
    
    if (uploadResult.imageUrls && uploadResult.imageUrls.length > 0) {
      return uploadResult.imageUrls[0];
    } else {
      throw new Error('Failed to upload image to Cloudinary');
    }

  } catch (error) {
    console.error('Error generating image with Replicate:', error);
    throw new Error(`Replicate generation failed: ${error.message}`);
  }
};

// Your existing uploadToCloudinary function
const uploadToCloudinary = async (filenames, generatedDir) => {
  const imageUrls = [];
  const uploadErrors = [];

  for (const filename of filenames) {
    const filepath = path.join(generatedDir, filename);
    if (fs.existsSync(filepath)) {
      try {
        const result = await cloudinary.uploader.upload(filepath, {
          folder: "toonkidz/story_images",
          public_id: `story_${Date.now()}_${filename}`,
          resource_type: "image",
        });
        imageUrls.push(result.secure_url);
        fs.unlinkSync(filepath);
        console.log(`Successfully uploaded and deleted: ${filename}`);
      } catch (uploadError) {
        console.error(`Error uploading ${filename}:`, uploadError);
        uploadErrors.push(filename);
      }
    } else {
      console.error(`File not found: ${filepath}`);
      uploadErrors.push(filename);
    }
  }

  if (uploadErrors.length > 0) {
    if (imageUrls.length > 0) {
      return {
        imageUrls,
        warning: `Some images failed to upload: ${uploadErrors.join(", ")}`,
      };
    } else {
      throw new Error(`Failed to upload images: ${uploadErrors.join(", ")}`);
    }
  }

  return { imageUrls };
};

// Optional: Function to generate a single image (if needed separately)
export const generateSingleImage = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const imageUrl = await generateImageWithFlux(prompt);

    res.json({
      success: true,
      imageUrl: imageUrl,
      prompt: prompt
    });

  } catch (error) {
    console.error('Error generating single image:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
};