//ai.config.js
import dotenv from "dotenv";

dotenv.config();
export const AI_MODELS = [
  {
    id: 'deepseek-chat',
    provider: 'deepseek',
    name: 'DeepSeek Chat',
    type: 'text-generation',
    model: 'deepseek-chat',
    envKey: 'DEEPSEEK_API_KEY',
    endpoint: 'https://api.deepseek.com/chat/completions',
    priority: 1,
  },
  {
    id: 'claude-3-7-sonnet',
    provider: 'replicate',
    name: 'Claude 3.7 Sonnet',
    type: 'text-generation',
    model: 'anthropic/claude-3-7-sonnet',
    envKey: 'REPLICATE_API_KEY',
    endpoint: 'https://api.replicate.com/v1/models/anthropic/claude-3-7-sonnet/predictions',
    priority: 2,
  },
  {
    id: 'gemini-flash',
    provider: 'google',
    name: 'Google Gemini Flash',
    type: 'text-generation',
    model: 'gemini-2.5-flash',
    envKey: 'GEMINI_API_KEY',
    endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
    priority: 3,
  },
  {
    id: 'qwen3-next-80b',
    provider: 'huggingface',
    name: 'Qwen/Qwen3-Next-80B-A3B-Instruct:novita',
    type: 'text-generation',
    model: 'Qwen/Qwen3-Next-80B-A3B-Instruct:novita',
    envKey: 'HUGGINGFACE_API_KEY',
    endpoint: process.env.HUGGINGFACE_API_KEY
      ? 'https://router.huggingface.co/v1/chat/completions'
      : null,
    priority: 4,
  },
  {
    id: 'pollinations-text',
    provider: 'pollinations',
    name: 'Pollinations Text Generation',
    type: 'text-generation',
    model: 'text-generation',
    envKey: null,
    endpoint: 'https://text.pollinations.ai',
    priority: 5,
  },
];

export const AI_RETRY_OPTIONS = {
  maxRetries: 2,
  timeoutMs: 60000,
};

export const DEFAULT_STORY_PROMPT = `
Hãy viết một câu chuyện thiếu nhi ngắn với:
- Tiêu đề (Title)
- Tóm tắt (Heading)
- Nội dung câu chuyện (Story)
Ngôn ngữ: Tiếng Việt.
`;

export const REQUIRED_ENV_KEYS = ['DEEPSEEK_API_KEY', 'REPLICATE_API_KEY', 'GEMINI_API_KEY', 'HUGGINGFACE_API_KEY'];