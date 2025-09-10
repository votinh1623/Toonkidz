const express = require('express');
const { spawn } = require('child_process');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path'); // Add this
const fs = require('fs'); // Add this
const config = require('./config/server.config');
const healthController = require('./controllers/health.controller.js');
const database = require('./lib/database.js');
const { exec } = require('child_process')
const authRoutes = require('./routes/auth.route.js');
const axios = require('axios');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();
const app = express();


// Add this to backend/src/app.js after loading dotenv
console.log('Environment variables loaded:');
console.log('ACCESS_TOKEN_SECRET:', process.env.ACCESS_TOKEN_SECRET ? '***SET***' : '***NOT SET***');
console.log('REFRESH_TOKEN_SECRET:', process.env.REFRESH_TOKEN_SECRET ? '***SET***' : '***NOT SET***');
// Middleware
app.use(helmet());
app.use(cors(config.cors));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));

app.use('/generated', express.static(path.join(__dirname, '../../storage/images/generated')));

// Create generated directory if it doesn't exist
const generatedDir = path.join(__dirname, '../../storage/images/generated');
if (!fs.existsSync(generatedDir)) {
  fs.mkdirSync(generatedDir, { recursive: true });
}
// Connect to databases
database.connectMongo();
database.connectRedis();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Routes
app.get('/health', healthController.healthCheck);
app.use('/api/auth', authRoutes);

// TTS Status Check Endpoint (MOVED HERE - BEFORE ERROR HANDLING)
app.get('/api/tts-status', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:5001/', { timeout: 5000 });
    res.json({
      status: 'running',
      message: 'TTS server is running'
    });
  } catch (error) {
    res.json({
      status: 'stopped',
      message: 'TTS server is not running'
    });
  }
});



// Image generation endpoint
app.post('/api/generate-image', (req, res) => {
  const prompt = req.body.prompt;
  const steps = req.body.steps || 20;
  const numImages = req.body.numImages || 4; // Default to 4 images if not specified

  console.log(`Generating ${numImages} images for prompt: "${prompt}" with ${steps} steps`);

  // Path to the Python script
  const scriptPath = path.join(__dirname, '../../gpu/scripts/generate.py');
  const python = spawn('python', [scriptPath, prompt, steps.toString(), numImages.toString()]);

  let output = '';
  let error = '';

  python.stdout.on('data', (data) => {
    output += data.toString();
  });

  python.stderr.on('data', (data) => {
    error += data.toString();
    console.error(`Python stderr: ${data}`);
  });

  python.on('close', async (code) => {
    if (code !== 0) {
      console.error(`Python process exited with code ${code}`);
      console.error(`Error output: ${error}`);
      return res.status(500).json({ error: 'Image generation failed', details: error });
    }

    // Get the last line of output which should be JSON
    const lines = output.trim().split('\n');
    const jsonLine = lines[lines.length - 1];

    let filenames;
    try {
      filenames = JSON.parse(jsonLine);
    } catch (e) {
      console.error('Failed to parse JSON from Python output:', jsonLine);
      console.error('Full output:', output);
      return res.status(500).json({ error: 'Invalid response from image generation', details: output });
    }

    if (!Array.isArray(filenames)) {
      console.error('Expected an array of filenames, got:', filenames);
      return res.status(500).json({ error: 'Invalid response from image generation', details: filenames });
    }

    console.log(`Generated images: ${filenames.join(', ')}`);

    // Upload each image to Cloudinary and collect URLs
    const imageUrls = [];
    const uploadErrors = [];

    for (const filename of filenames) {
      const filepath = path.join(generatedDir, filename);
      if (fs.existsSync(filepath)) {
        try {
          const result = await cloudinary.uploader.upload(filepath, {
            folder: 'generated-images',
            public_id: `generated_${Date.now()}_${filename}`,
            resource_type: 'image'
          });
          imageUrls.push(result.secure_url);
          // Delete local file after successful upload
          fs.unlinkSync(filepath);
          console.log(`Uploaded and deleted: ${filename}`);
        } catch (uploadError) {
          console.error(`Error uploading ${filename}:`, uploadError);
          uploadErrors.push(filename);
        }
      } else {
        uploadErrors.push(filename);
      }
    }

    if (uploadErrors.length > 0) {
      // If some images were uploaded successfully, return them with a warning
      if (imageUrls.length > 0) {
        return res.status(206).json({
          imageUrls,
          warning: `Some images failed to upload: ${uploadErrors.join(', ')}`
        });
      } else {
        return res.status(500).json({ error: 'Failed to upload images', details: uploadErrors });
      }
    }

    res.json({ imageUrls });
  });
});

// TTS Generation Endpoint (MOVED HERE)
app.post('/api/generate-tts', async (req, res) => {
  try {
    const { text, voice = 'vi-VN-HoaiMyNeural' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    console.log('Generating TTS for text:', text);

    // Call Edge TTS server
    const response = await axios.post('http://localhost:5001/tts', {
      text,
      voice
    }, {
      responseType: 'arraybuffer',
      timeout: 30000 // 30 second timeout
    });

    console.log('TTS generated successfully');

    // Set appropriate headers for audio response
    res.set('Content-Type', 'audio/mpeg');
    res.set('Content-Length', response.data.byteLength);
    res.send(response.data);

  } catch (error) {
    console.error('Error in generate-tts endpoint:', error.message);

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'TTS server is not running' });
    }

    if (error.code === 'ETIMEDOUT') {
      return res.status(504).json({ error: 'TTS generation timeout' });
    }

    res.status(500).json({ error: 'Failed to generate speech' });
  }
});

// Error handling middleware (MOVED TO THE END)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});