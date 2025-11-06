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
import { fileURLToPath } from "url";
import config from "./config/server.config.js";
import imageRoutes from "./routes/image.route.js";
import themeRoutes from "./routes/theme.route.js"
import healthController from "./controllers/health.controller.js";
import feedbackRoutes from './routes/feedback.route.js';
import notificationRoutes from './routes/notification.route.js';
import database from "./lib/database.js";
import { exec } from "child_process";

import { createServer } from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/auth.route.js";
import storyRoutes from './routes/story.route.js';
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";
import userRoutes from './routes/user.route.js';
import postRoutes from './routes/post.route.js';

import messageRoutes from './routes/message.route.js';
import conversationRoutes from './routes/conversation.route.js';
import { initializeSocketIO } from "./socket/socket.js";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

console.log('Environment variables loaded:');
console.log('ACCESS_TOKEN_SECRET:', process.env.ACCESS_TOKEN_SECRET ? '***SET***' : '***NOT SET***');
console.log('REFRESH_TOKEN_SECRET:', process.env.REFRESH_TOKEN_SECRET ? '***SET***' : '***NOT SET***');
console.log('Mongo: ', process.env.MONGO_URI);
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
app.get('/health', healthController);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/themes', themeRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/notifications', notificationRoutes);

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

app.post('/api/generate-tts', async (req, res) => {
  try {
    const { text, voice = 'vi-VN-HoaiMyNeural' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    console.log('Generating TTS for text:', text);

    const response = await axios.post('http://localhost:5001/tts', {
      text,
      voice
    }, {
      responseType: 'arraybuffer',
      timeout: 30000
    });

    console.log('TTS generated successfully');

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

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

initializeSocketIO(io);

const PORT = config.port;
server.listen(PORT, () => {
  console.log(`Server (Express + Socket.IO) đang chạy trên port ${PORT}`);
});