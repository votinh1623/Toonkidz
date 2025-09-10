const express = require('express');
const { spawn } = require('child_process');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path'); 
const fs = require('fs'); 
const config = require('./config/server.config');
const imageRoutes = require('./routes/image.route.js');
const healthController = require('./controllers/health.controller.js');
const database = require('./lib/database.js');
const { exec } = require('child_process')
const authRoutes = require('./routes/auth.route.js');
const axios = require('axios');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();
const app = express();

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
app.use('/api', imageRoutes); 
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