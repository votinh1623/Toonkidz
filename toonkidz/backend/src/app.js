//app.js
import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { spawn } from "child_process";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url"; // Add this import
import config from "./config/server.config.js";
import imageRoutes from "./routes/image.route.js";
import themeRoutes from "./routes/theme.route.js"
import healthController from "./controllers/health.controller.js";
import database from "./lib/database.js";
import { exec } from "child_process";
import authRoutes from "./routes/auth.route.js";
import storyRoutes from './routes/story.route.js';
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Use the __dirname we created
app.use('/generated', express.static(path.join(__dirname, '../../storage/images/generated')));

// Create generated directory if it doesn't exist
const generatedDir = path.join(__dirname, '../../storage/images/generated');
if (!fs.existsSync(generatedDir)) {
  fs.mkdirSync(generatedDir, { recursive: true });
}

// Connect to databases
database.connectMongo();
console.log("Redis URL:", process.env.REDIS_URL);
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
app.use('/api/story', storyRoutes);
app.use('/api/themes', themeRoutes);

// TTS Status Check Endpoint
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

// TTS Generation Endpoint
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});