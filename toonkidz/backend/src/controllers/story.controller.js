// story.controller.js
import axios from 'axios';
import { AI_MODELS, AI_RETRY_OPTIONS } from '../config/ai.config.js';
import Story from '../models/story.model.js';
import cloudinary from "../lib/cloudinary.js";
import fs from "fs";
import path from "path";
import Replicate from "replicate";
import { writeFile } from "fs/promises";
import { generateImagesForStory } from './image.controller.js';
import User from '../models/user.model.js';
import Post from '../models/post.model.js';
import redis from '../lib/redis.js';

const checkTTSServer = async () => {
  try {
    const response = await axios.get('http://localhost:5001/health', {
      timeout: 5000
    });
    return response.data.status === 'healthy';
  } catch (error) {
    console.warn('TTS server is not available:', error.message);
    return false;
  }
};

// Hàm tạo audio cho từng trang truyện
const generateAudioForPages = async (pages, storyId, voice = 'vi-VN-HoaiMyNeural') => {
  try {
    console.log('Starting audio generation for story:', storyId, 'with voice:', voice);

    // Kiểm tra TTS server có hoạt động không
    const isTTSServerAvailable = await checkTTSServer();
    if (!isTTSServerAvailable) {
      console.warn('TTS server is not available, skipping audio generation');
      return pages.map(page => ({
        ...page,
        audio: '' // Trả về pages không có audio
      }));
    }

    const pagesWithAudio = await Promise.all(
      pages.map(async (page) => {
        try {
          // Gọi edge_tts_server để tạo audio
          const ttsResponse = await axios.post('http://localhost:5001/tts', {
            text: page.content,
            voice: voice
          }, {
            responseType: 'arraybuffer',
            timeout: 30000 // 30 seconds timeout
          });

          // Tạo file audio tạm thời
          const tempDir = path.join(process.cwd(), 'temp');
          if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
          }

          const audioFilename = `audio_${storyId}_page${page.pageNumber}_${Date.now()}.mp3`;
          const audioFilePath = path.join(tempDir, audioFilename);

          // Lưu file audio tạm thời
          await writeFile(audioFilePath, ttsResponse.data);

          // Upload lên Cloudinary
          const uploadResult = await cloudinary.uploader.upload(audioFilePath, {
            resource_type: "video",
            folder: "toonkidz/story_audios",
            format: "mp3",
          });

          // Xóa file tạm
          fs.unlinkSync(audioFilePath);

          console.log(`Audio generated for page ${page.pageNumber} with voice ${voice}:`, uploadResult.secure_url);

          return {
            pageNumber: page.pageNumber,
            content: page.content,
            image: page.image || '',
            audio: uploadResult.secure_url
          };
        } catch (error) {
          console.error(`Error generating audio for page ${page.pageNumber} with voice ${voice}:`, error);
          // Trả về trang không có audio nếu lỗi
          return {
            pageNumber: page.pageNumber,
            content: page.content,
            image: page.image || '',
            audio: '' // Để trống nếu không tạo được audio
          };
        }
      })
    );

    return pagesWithAudio;
  } catch (error) {
    console.error('Error in generateAudioForPages:', error);
    // Trả về pages không có audio nếu có lỗi
    return pages.map(page => ({
      ...page,
      audio: ''
    }));
  }
};

export const generateStory = async (req, res) => {
  const { theme, keywords, pages, prompt: userPrompt, includeAudio = false, voice = 'vi-VN-HoaiMyNeural', ageGroup = '6-8' } = req.body;
  const userId = req.user._id;

  console.log('Generate story request:', {
    theme,
    keywords: keywords?.length,
    pages,
    includeAudio,
    voice,
    ageGroup
  });

  if (!theme && !userPrompt) {
    return res.status(400).json({ error: 'Theme or prompt is required' });
  }

  const storyKeywords = Array.isArray(keywords) && keywords.length > 0 ? keywords : [];

  const basePrompt = userPrompt
    ? `ĐÂY LÀ Ý TƯỞNG NGƯỜI DÙNG GÕ TRỰC TIẾP (ưu tiên cao nhất): *${userPrompt}*`
    : `CHỦ ĐỀ: "${theme}"`;

  const prompt = `
${basePrompt}

Tạo một câu chuyện thiếu nhi bằng tiếng Việt với các yêu cầu sau:

TỪ KHÓA BẮT BUỘC (nếu có): ${storyKeywords.length ? storyKeywords.join(', ') : 'Không có từ khóa bắt buộc.'}

YÊU CẦU BẮT BUỘC:
1. Tiêu đề: Một dòng ngắn gọn, hấp dẫn.
2. Tóm tắt: Một hoặc hai câu mô tả nội dung chính của câu chuyện.
3. Câu chuyện: Chia thành ${pages || 2} trang, mỗi trang khoảng 20 từ.
4. Mỗi trang phải có nội dung hoàn chỉnh và liên kết với trang trước/sau.
5. Mỗi trang PHẢI có imagePrompt bằng tiếng Anh.
6. PHẢI có coverImagePrompt bằng tiếng Anh.

ĐỊNH DẠNG JSON BẮT BUỘC - KHÔNG ĐƯỢC THIẾU BẤT KỲ TRƯỜNG NÀO:
{
  "title": "Tiêu đề câu chuyện",
  "heading": "Tóm tắt ngắn gọn",
  "coverImagePrompt": "English prompt for cover image",
  "pages": [
    {
      "pageNumber": 1,
      "content": "Nội dung trang 1 bằng tiếng Việt",
      "imagePrompt": "English prompt for page 1 image"
    },
    {
      "pageNumber": 2,
      "content": "Nội dung trang 2 bằng tiếng Việt",
      "imagePrompt": "English prompt for page 2 image"
    }
  ]
}

QUY TẮC VIẾT IMAGE PROMPT:
- VIẾT HOÀN TOÀN BẰNG TIẾNG ANH
- Mô tả: nhân vật + hành động + bối cảnh + cảm xúc
- Luôn chú ý là không được để xuất hiện chữ cái lên ảnh
- Phong cách: cartoon, children's book illustration, bright colors, friendly
- Cover image: tổng quan câu chuyện, hấp dẫn

VÍ DỤ ĐẦY ĐỦ:
{
  "title": "Chú Thỏ Thông Minh",
  "heading": "Chú thỏ giúp đỡ bạn bè trong rừng",
  "coverImagePrompt": "Cute white rabbit standing in sunny forest, cartoon style, bright colors, children's book cover, friendly animals in background",
  "pages": [
    {
      "pageNumber": 1,
      "content": "Thỏ Bông đi khám phá khu rừng xanh...",
      "imagePrompt": "Small white rabbit exploring sunny forest, cartoon style, bright green trees, happy expression, adventure time"
    },
    {
      "pageNumber": 2, 
      "content": "Thỏ giúp Sóc tìm hạt dẻ...",
      "imagePrompt": "Rabbit helping squirrel get acorns from tree hole, cartoon style, friendly animals working together, forest setting"
    }
  ]
}

Lưu ý:
- Nội dung câu chuyện viết bằng tiếng Việt
- Image prompts viết bằng tiếng Anh
- KHÔNG ĐƯỢC thiếu imagePrompt trong bất kỳ trang nào
- KHÔNG ĐƯỢC thiếu coverImagePrompt
`;

  const sortedModels = AI_MODELS.sort((a, b) => a.priority - b.priority);

  for (const model of sortedModels) {
    let attempt = 0;

    while (attempt < (AI_RETRY_OPTIONS.maxRetries || 1)) {
      try {
        let storyText = '';

        // Generate story content (giữ nguyên phần này)
        if (model.provider === 'replicate') {
          const response = await axios.post(
            model.endpoint,
            {
              input: {
                prompt: prompt,
                system_prompt: "Bạn là một nhà văn chuyên viết truyện thiếu nhi. Hãy viết câu chuyện bằng tiếng Việt với cấu trúc trang rõ ràng và tạo mô tả hình ảnh bằng tiếng Anh.",
                max_tokens: 2000,
                temperature: 0.8
              }
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${process.env[model.envKey]}`
              },
              timeout: AI_RETRY_OPTIONS.timeoutMs
            }
          );

          if (response.data.status === 'succeeded') {
            storyText = response.data.output.join('');
          } else if (response.data.output) {
            storyText = Array.isArray(response.data.output)
              ? response.data.output.join('')
              : response.data.output;
          } else {
            throw new Error('Replicate response not ready');
          }
        }
        else if (model.provider === 'deepseek') {
          const response = await axios.post(
            model.endpoint,
            {
              model: model.model,
              messages: [
                {
                  role: "user",
                  content: prompt
                }
              ],
              temperature: 0.8,
              max_tokens: 2000,
              stream: false
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env[model.envKey]}`
              },
              timeout: AI_RETRY_OPTIONS.timeoutMs
            }
          );
          storyText = response.data.choices[0].message.content;
        }
        else if (model.provider === 'google') {
          const response = await axios.post(
            `${model.endpoint}?key=${process.env.GEMINI_API_KEY}`,
            {
              contents: [
                {
                  role: "user",
                  parts: [{ text: prompt }]
                }
              ],
              generation_config: {
                temperature: 0.8,
                max_output_tokens: 2500
              }
            },
            {
              headers: { 'Content-Type': 'application/json' },
              timeout: AI_RETRY_OPTIONS.timeoutMs
            }
          );
          storyText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }
        else if (model.provider === 'huggingface') {
          const response = await axios.post(
            model.endpoint,
            {
              model: model.model,
              messages: [
                {
                  role: "user",
                  content: prompt
                }
              ],
              temperature: 0.8,
              max_tokens: 2000
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env[model.envKey]}`
              },
              timeout: AI_RETRY_OPTIONS.timeoutMs
            }
          );
          storyText = response.data.choices?.[0]?.message?.content || '';
        }
        else if (model.provider === 'pollinations') {
          const encodedPrompt = encodeURIComponent(prompt);
          const response = await axios.get(
            `${model.endpoint}/${encodedPrompt}`,
            { timeout: AI_RETRY_OPTIONS.timeoutMs }
          );

          if (typeof response.data === 'string') {
            storyText = response.data;
          } else if (response.data && typeof response.data === 'object') {
            storyText = response.data.text ||
              response.data.content ||
              response.data.generated_text ||
              response.data.output ||
              JSON.stringify(response.data);
          } else {
            storyText = String(response.data || '');
          }
        }

        storyText = String(storyText || '');
        if (!storyText || storyText.trim() === '') throw new Error('Empty response from AI');

        console.log('=== RAW AI RESPONSE ===');
        console.log(storyText);
        console.log('=== END RAW RESPONSE ===');

        let result;
        try {
          result = JSON.parse(storyText);
        } catch {
          result = await parseNonJSONResponse(storyText, theme);
        }

        if (!result.pages || !Array.isArray(result.pages)) {
          throw new Error('Invalid response format: missing pages array');
        }

        // Create pages với audio rỗng ban đầu
        const pagesWithPrompts = result.pages.map((page, index) => ({
          pageNumber: page.pageNumber || index + 1,
          content: page.content,
          imagePrompt: page.imagePrompt || generateFallbackImagePrompt(page.content, result.title, index + 1)
        }));

        // Create temporary story data - KHỞI TẠO AUDIO LÀ RỖNG
        const storyData = {
          theme: theme,
          title: result.title || `Câu chuyện về ${theme}`,
          head: result.heading || 'Một câu chuyện thú vị dành cho trẻ em',
          content: pagesWithPrompts.map(page => page.content).join('\n\n'),
          pages: pagesWithPrompts.map(page => ({
            pageNumber: page.pageNumber,
            content: page.content,
            image: '', // Will be updated after image generation
            audio: '' // Sẽ được cập nhật sau nếu có audio
          })),
          coverImage: '',
          coverImagePrompt: result.coverImagePrompt || generateFallbackCoverPrompt(result.title, result.heading),
          userId: userId,
          status: 'generating', // Trạng thái đang tạo
          tags: storyKeywords.join(', '),
          readingTime: Math.ceil(pagesWithPrompts.length * 0.5),
          ageGroup: ageGroup,
          language: 'vi'
        };

        // Save story tạm thời
        const tempStory = await Story.create(storyData);
        console.log('Temporary story created:', tempStory._id);

        // BƯỚC 1: Generate images trước
        console.log('Starting image generation for story:', tempStory._id);
        let imageResult;
        try {
          imageResult = await generateImagesForStoryInternal(
            tempStory._id.toString(),
            {
              coverImagePrompt: result.coverImagePrompt,
              pages: result.pages.map(page => ({
                pageNumber: page.pageNumber,
                prompt: page.imagePrompt
              }))
            }
          );
          console.log('Image generation completed');
        } catch (imageError) {
          console.error('Image generation failed:', imageError);
          // Update story status to failed
          await Story.findByIdAndUpdate(tempStory._id, {
            status: 'failed'
          });
          throw new Error(`Image generation failed: ${imageError.message}`);
        }

        // Cập nhật pages với images
        let finalPages = tempStory.pages.map(page => {
          const generatedPage = imageResult.pages.find(p => p.pageNumber === page.pageNumber);
          return {
            pageNumber: page.pageNumber,
            content: page.content,
            image: generatedPage ? generatedPage.image : '',
            audio: '' // Vẫn giữ audio rỗng
          };
        });

        // BƯỚC 2: Generate audio NẾU được chọn
        if (includeAudio) {
          console.log('Starting audio generation for story:', tempStory._id, 'with voice:', voice);
          try {
            finalPages = await generateAudioForPages(finalPages, tempStory._id.toString(), voice);
            console.log(`Audio generation completed: ${finalPages.filter(p => p.audio).length}/${finalPages.length} pages have audio`);
          } catch (audioError) {
            console.error('Audio generation failed, but continuing with story:', audioError);
            // Vẫn tiếp tục với story, nhưng không có audio
            finalPages = finalPages.map(page => ({
              ...page,
              audio: ''
            }));
          }
        }

        // BƯỚC 3: Update story cuối cùng với cả images và audio
        const updatedStory = await Story.findByIdAndUpdate(
          tempStory._id,
          {
            coverImage: imageResult.coverImage,
            pages: finalPages,
            status: 'completed'
          },
          { new: true }
        );

        console.log('Story completed successfully:', updatedStory._id);
        console.log('Story details:', {
          title: updatedStory.title,
          pages: updatedStory.pages.length,
          hasImages: updatedStory.pages.every(p => p.image),
          hasAudio: includeAudio ? updatedStory.pages.some(p => p.audio) : false
        });

        // Return complete story
        return res.json({
          success: true,
          storyId: updatedStory._id,
          title: updatedStory.title,
          heading: updatedStory.head,
          pages: updatedStory.pages,
          coverImage: updatedStory.coverImage,
          theme: updatedStory.theme,
          keywords: storyKeywords,
          model_used: model.name,
          status: 'completed',
          hasAudio: includeAudio,
          voiceUsed: includeAudio ? voice : null,
          audioStats: includeAudio ? {
            totalPages: finalPages.length,
            pagesWithAudio: finalPages.filter(p => p.audio).length
          } : null
        });

      } catch (err) {
        console.warn(`Attempt ${attempt + 1} failed for model ${model.name}:`, err.message);

        const errorMessage = err.message?.toLowerCase() || '';
        const responseData = err.response?.data;

        const shouldSwitchModel =
          errorMessage.includes('token') ||
          errorMessage.includes('quota') ||
          errorMessage.includes('limit') ||
          errorMessage.includes('rate') ||
          errorMessage.includes('billing') ||
          errorMessage.includes('payment') ||
          errorMessage.includes('exceeded') ||
          (responseData && (
            (responseData.error?.message?.toLowerCase().includes('token')) ||
            (responseData.error?.message?.toLowerCase().includes('quota')) ||
            (responseData.error?.message?.toLowerCase().includes('limit')) ||
            (responseData.error?.message?.toLowerCase().includes('billing'))
          ));

        if (shouldSwitchModel) {
          console.warn(`Model ${model.name} reached limits, switching to next model...`);
          break;
        }

        if (err.response) {
          console.warn('Error response data:', err.response.data);
        }
        attempt++;
      }
    }
  }

  return res.status(500).json({
    error: 'All AI models failed to generate story',
    message: 'Xin lỗi, tất cả các dịch vụ AI hiện đang gặp sự cố. Vui lòng thử lại sau.'
  });
};

export const savePreviewStory = async (req, res) => {
  try {
    const { storyId } = req.params;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    // Update status from 'preview' to 'published' or 'draft'
    const updatedStory = await Story.findByIdAndUpdate(
      storyId,
      {
        status: req.body.status || 'published',
        ...(req.body.title && { title: req.body.title }),
        ...(req.body.head && { head: req.body.head })
      },
      { new: true }
    );

    res.json({
      success: true,
      story: updatedStory,
      message: 'Story saved successfully'
    });
  } catch (error) {
    console.error('Error saving story:', error);
    res.status(500).json({ error: 'Failed to save story' });
  }
};

// Internal function to generate images (adapted from image.controller.js)
const generateImagesForStoryInternal = async (storyId, imagePrompts) => {
  try {
    const { coverImagePrompt, pages } = imagePrompts;

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

    // Return the image results
    return {
      coverImage: coverImageUrl,
      pages: pagesWithImages
    };

  } catch (error) {
    console.error('Error generating images internally:', error);
    throw error;
  }
};

// Image generation function with Replicate Flux Schnell
const generateImageWithFlux = async (prompt) => {
  try {
    // Enhance the prompt for better results
    const enhancedPrompt = `${prompt}, cartoon style, children's book illustration, bright vibrant colors, friendly characters, detailed, 4k, professional artwork`;

    console.log('Generating image with prompt:', enhancedPrompt);

    // Check if we have Replicate API key
    if (!process.env.REPLICATE_API_KEY) {
      throw new Error('Replicate API key not configured');
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_KEY,
    });

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

    console.log('Replicate output received');

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

    // Upload to Cloudinary using your existing pattern
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

function generateFallbackImagePrompt(content, title, pageNumber) {
  const mainCharacter = title.split(' ')[0] || 'character';
  return `Children's book illustration, cartoon style, bright colors, friendly ${mainCharacter}, ${content.substring(0, 100)}... detailed, vibrant, 4k`;
}

function generateFallbackCoverPrompt(title, heading) {
  return `Children's book cover, ${title}, cartoon style, bright vibrant colors, friendly characters, detailed illustration, 4k, professional artwork`;
}

async function parseNonJSONResponse(storyText, theme) {
  const lines = storyText.split('\n').map(l => l.trim()).filter(Boolean);

  let title = '';
  let heading = '';
  let coverImagePrompt = '';
  const pages = [];
  let currentPage = null;
  let inImagePromptSection = false;

  for (const line of lines) {
    const lower = line.toLowerCase();

    if (lower.startsWith('title:') || lower.startsWith('tiêu đề:')) {
      title = line.replace(/title:|tiêu đề:/i, '').trim();
    } else if (lower.startsWith('heading:') || lower.startsWith('tóm tắt:') || lower.startsWith('summary:')) {
      heading = line.replace(/heading:|tóm tắt:|summary:/i, '').trim();
    } else if (lower.startsWith('coverimageprompt:') || lower.startsWith('cover image prompt:')) {
      coverImagePrompt = line.replace(/coverimageprompt:|cover image prompt:/i, '').trim();
    } else if (lower.startsWith('page') || lower.startsWith('trang')) {
      if (currentPage) {
        pages.push(currentPage);
      }
      const pageMatch = line.match(/(\d+)/);
      const pageNumber = pageMatch ? parseInt(pageMatch[1]) : pages.length + 1;
      currentPage = {
        pageNumber,
        content: '',
        imagePrompt: ''
      };
      inImagePromptSection = false;
    } else if (lower.startsWith('imageprompt:') || lower.startsWith('image prompt:')) {
      if (currentPage) {
        currentPage.imagePrompt = line.replace(/imageprompt:|image prompt:/i, '').trim();
        inImagePromptSection = true;
      }
    } else if (currentPage) {
      if (inImagePromptSection) {
        currentPage.imagePrompt += ' ' + line;
      } else {
        currentPage.content += (currentPage.content ? ' ' : '') + line;
      }
    }
  }

  if (currentPage) {
    pages.push(currentPage);
  }

  if (pages.length === 0) {
    const content = lines.join(' ');
    pages.push({
      pageNumber: 1,
      content: content,
      imagePrompt: generateFallbackImagePrompt(content, title, 1)
    });
  }

  if (!title) title = `Câu chuyện về ${theme}`;
  if (!heading) heading = 'Một câu chuyện thú vị dành cho trẻ em';
  if (!coverImagePrompt) coverImagePrompt = generateFallbackCoverPrompt(title, heading);

  pages.forEach((page, index) => {
    if (!page.imagePrompt) {
      page.imagePrompt = generateFallbackImagePrompt(page.content, title, index + 1);
    }
  });

  return { title, heading, coverImagePrompt, pages };
}

export const getStoryImagePrompts = async (req, res) => {
  try {
    const { storyId } = req.params;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    res.json({
      success: true,
      imagePrompts: {
        cover: story.coverImagePrompt,
        pages: story.pages.map(page => ({
          pageNumber: page.pageNumber,
          content: page.content,
          prompt: page.imagePrompt
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching story image prompts:', error);
    res.status(500).json({ error: 'Failed to fetch story image prompts' });
  }
};

export const getStory = async (req, res) => {
  try {
    const { storyId } = req.params;

    const story = await Story.findById(storyId).populate('userId', 'name email');
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    res.json({
      success: true,
      story: {
        id: story._id,
        title: story.title,
        head: story.head,
        theme: story.theme,
        pages: story.pages,
        status: story.status,
        readingTime: story.readingTime,
        ageGroup: story.ageGroup,
        createdAt: story.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching story:', error);
    res.status(500).json({ error: 'Failed to fetch story' });
  }
};

export const createStory = async (req, res) => {
  try {
    const { title, head, theme, pages } = req.body;

    if (!title || !head || !theme || !pages) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: title, head, theme, or pages",
      });
    }

    const parsedPages = JSON.parse(pages);
    const files = req.files || [];
    const findFile = (fieldName) => {
      const file = files.find((f) => f.fieldname === fieldName);
      return file ? file.path : null;
    };
    let coverImageUrl = null;
    const coverPath = findFile("coverImage");
    if (coverPath) {
      try {
        const coverUpload = await cloudinary.uploader.upload(coverPath, {
          folder: "toonkidz/story_covers",
        });
        coverImageUrl = coverUpload.secure_url;
      } finally {
        fs.unlink(coverPath, (err) => {
          if (err) console.warn("Could not delete temp cover file:", err);
        });
      }
    }
    const storyPages = [];
    for (let i = 0; i < parsedPages.length; i++) {
      const page = parsedPages[i];
      const imgPath = findFile(`pageImage_${i}`);
      const audioPath = findFile(`pageAudio_${i}`);

      let imageUrl = null;
      let audioUrl = null;

      if (imgPath) {
        try {
          const imgUpload = await cloudinary.uploader.upload(imgPath, {
            folder: "toonkidz/story_pages",
          });
          imageUrl = imgUpload.secure_url;
        } finally {
          fs.unlink(imgPath, (err) => {
            if (err) console.warn(`Could not delete image temp file ${imgPath}:`, err);
          });
        }
      }

      if (audioPath) {
        try {
          const audioUpload = await cloudinary.uploader.upload(audioPath, {
            resource_type: "video",
            folder: "toonkidz/story_audios",
            format: "mp3",
          });
          audioUrl = audioUpload.secure_url;
        } finally {
          fs.unlink(audioPath, (err) => {
            if (err) console.warn(`Could not delete audio temp file ${audioPath}:`, err);
          });
        }
      }

      storyPages.push({
        pageNumber: i + 1,
        content: page.content,
        image: imageUrl,
        audio: audioUrl,
      });
    }

    const story = await Story.create({
      title,
      head,
      theme,
      userId: req.user._id,
      pages: storyPages,
      coverImage: coverImageUrl,
      status: "draft",
    });
    await redis.deleteByPattern('stories:public:*');

    return res.status(201).json({ success: true, story });
  } catch (error) {
    console.error("Error creating story:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllStories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const status = req.query.status || "";
    const theme = req.query.theme || "";

    const query = {
      title: { $regex: search, $options: "i" },
    };

    if (status) {
      query.status = status;
    }

    if (theme) {
      query.theme = theme;
    }

    const stories = await Story.find(query)
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalStories = await Story.countDocuments(query);

    res.json({
      success: true,
      stories,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalStories / limit),
        totalStories
      }
    });

  } catch (error) {
    console.error('Error fetching stories!: ', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stories!' });
  }
};

export const getStoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user ? req.user._id.toString() : null;
    const story = await Story.findById(id).populate('userId', 'name email');

    if (!story) {
      return res.status(404).json({ success: false, error: 'Story not found' });
    }

    let myRating = 0;

    if (currentUserId && story.ratedBy && story.ratedBy.length > 0) {
      const userRate = story.ratedBy.find(r => r.userId.toString() === currentUserId);
      if (userRate) {
        myRating = userRate.rating;
      }
    }

    const storyData = story.toObject();
    storyData.myRating = myRating;

    res.json({
      success: true,
      story: storyData
    });

  } catch (error) {
    console.error('Error fetching story by ID:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch story' });
  }
};

export const updateStory = async (req, res) => {
  try {
    const { title, head, theme, status, pages: pagesJSON } = req.body;
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({ success: false, error: 'Story not found' });
    }

    if (story.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'User not authorized to update this story' });
    }

    const files = req.files || [];
    const findFile = (fieldName) => files.find((f) => f.fieldname === fieldName)?.path || null;

    story.title = title;
    story.head = head;
    story.theme = theme;
    story.status = status;

    const coverPath = findFile("coverImage");
    if (coverPath) {
      const coverUpload = await cloudinary.uploader.upload(coverPath, { folder: "toonkidz/story_covers" });
      story.coverImage = coverUpload.secure_url;
      fs.unlinkSync(coverPath);
    }
    const submittedPages = JSON.parse(pagesJSON);
    const updatedPages = [];

    for (let i = 0; i < submittedPages.length; i++) {
      const pageData = submittedPages[i];
      const imgPath = findFile(`pageImage_${i}`);
      const audioPath = findFile(`pageAudio_${i}`);

      let imageUrl = pageData.image || null;
      let audioUrl = pageData.audio || null;
      if (imgPath) {
        const imgUpload = await cloudinary.uploader.upload(imgPath, { folder: "toonkidz/story_pages" });
        imageUrl = imgUpload.secure_url;
        fs.unlinkSync(imgPath);
      }
      if (audioPath) {
        const audioUpload = await cloudinary.uploader.upload(audioPath, { resource_type: "video", folder: "toonkidz/story_audios" });
        audioUrl = audioUpload.secure_url;
        fs.unlinkSync(audioPath);
      }

      updatedPages.push({
        pageNumber: i + 1,
        content: pageData.content,
        image: imageUrl,
        audio: audioUrl,
      });
    }
    story.pages = updatedPages;

    const savedStory = await story.save();
    await redis.deleteByPattern('stories:public:*');
    return res.status(200).json({ success: true, story: savedStory });

  } catch (error) {
    console.error("Error updating story:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({ success: false, error: 'Story not found' });
    }

    if (story.coverImage) {
      const publicId = story.coverImage.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`toonkidz/story_covers/${publicId}`);
    }
    for (const page of story.pages) {
      if (page.image) {
        const publicId = page.image.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`toonkidz/story_pages/${publicId}`);
      }
      if (page.audio) {
        const publicId = page.audio.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`toonkidz/story_audios/${publicId}`, { resource_type: 'video' });
      }
    }

    await story.deleteOne();
    await redis.deleteByPattern('stories:public:*');

    res.json({ success: true, message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Error deleting story:', error);
    res.status(500).json({ success: false, error: 'Failed to delete story' });
  }
};

export const getMyStories = async (req, res) => {
  try {
    const userId = req.user._id;

    const stories = await Story.find({ userId: userId })
      .sort({ createdAt: -1 });

    if (!stories) {
      return res.status(404).json({ success: false, error: 'No stories found for this user' });
    }

    res.json({ success: true, stories });
  } catch (error) {
    console.error('Error fetching user stories:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user stories' });
  }
};

// export const getPublicStories = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 12;
//     const search = req.query.search || "";
//     const theme = req.query.theme;
//     const ageGroup = req.query.ageGroup;

//     const query = { status: "published" };

//     if (theme && theme !== 'null') query.theme = theme;
//     if (ageGroup && ageGroup !== 'null') query.ageGroup = ageGroup;
//     if (search) query.title = { $regex: search, $options: "i" };
//     let sortQuery = { createdAt: -1 };

//     if (req.query.sortBy === 'ratingAvg') {
//       sortQuery = { ratingAvg: -1, totalLikes: -1, createdAt: -1 };
//     } else if (req.query.sortBy === 'readCount') {
//       sortQuery = { readCount: -1, totalLikes: -1, createdAt: -1 };
//     }

//     const stories = await Story.find(query)
//       .populate('userId', 'name pfp')
//       .sort(sortQuery)
//       .skip((page - 1) * limit)
//       .limit(limit);

//     const totalStories = await Story.countDocuments(query);

//     res.json({
//       success: true,
//       stories,
//       pagination: {
//         currentPage: page,
//         totalPages: Math.ceil(totalStories / limit),
//         totalStories
//       }
//     });

//   } catch (error) {
//     console.error('Error fetching public stories:', error);
//     res.status(500).json({ success: false, error: 'Failed to fetch stories' });
//   }
// };

export const getPublicStories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const search = req.query.search || "";
    const theme = req.query.theme || "";
    const ageGroup = req.query.ageGroup || "";
    const sortBy = req.query.sortBy || "newest";
    const queryParams = { page, limit, search, theme, ageGroup, sortBy };
    const cacheKey = `stories:public:${JSON.stringify(queryParams)}`;

    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }
    } catch (cacheError) {
      console.error("Redis get error (skipping cache):", cacheError);
    }

    const query = { status: "published" };

    if (theme && theme !== 'null') query.theme = theme;
    if (ageGroup && ageGroup !== 'null') query.ageGroup = ageGroup;
    if (search) query.title = { $regex: search, $options: "i" };

    let sortQuery = { createdAt: -1 };
    if (sortBy === 'ratingAvg') {
      sortQuery = { ratingAvg: -1, totalLikes: -1, createdAt: -1 };
    } else if (sortBy === 'readCount') {
      sortQuery = { readCount: -1, totalLikes: -1, createdAt: -1 };
    }

    const stories = await Story.find(query)
      .populate('userId', 'name pfp')
      .sort(sortQuery)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const totalStories = await Story.countDocuments(query);

    const responseData = {
      success: true,
      stories,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalStories / limit),
        totalStories
      }
    };

    try {
      await redis.set(cacheKey, JSON.stringify(responseData), "EX", 300);
    } catch (cacheError) {
      console.error("Redis set error:", cacheError);
    }

    res.json(responseData);

  } catch (error) {
    console.error('Error fetching public stories:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stories' });
  }
};

export const incrementReadCount = async (req, res) => {
  try {
    const { id } = req.params;
    const story = await Story.findByIdAndUpdate(
      id,
      { $inc: { readCount: 1 } },
      { new: true }
    );
    if (!story) return res.status(404).json({ success: false, error: "Story not found" });

    res.json({ success: true, readCount: story.readCount });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const syncStoryStats = async (req, res) => {
  try {
    console.log("Starting sync stats...");
    const updateResult = await Story.updateMany(
      {
        $or: [
          { readCount: { $exists: false } },
          { totalLikes: { $exists: false } }
        ]
      },
      {
        $set: {
          readCount: 0,
          totalLikes: 0
        }
      }
    );
    console.log(`Initialized stats for ${updateResult.modifiedCount} old stories.`);
    const aggregation = await Post.aggregate([
      {
        $match: { storyId: { $exists: true } }
      },
      {
        $group: {
          _id: "$storyId",
          calculatedLikes: { $sum: { $size: "$likes" } }
        }
      }
    ]);

    let syncedCount = 0;
    for (const item of aggregation) {
      if (item._id) {
        await Story.findByIdAndUpdate(item._id, {
          totalLikes: item.calculatedLikes || 0
        });
        syncedCount++;
      }
    }

    res.json({
      success: true,
      message: `Đã khởi tạo dữ liệu cho ${updateResult.modifiedCount} truyện cũ và đồng bộ like cho ${syncedCount} truyện.`
    });

  } catch (error) {
    console.error("Sync failed:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getSystemStats = async (req, res) => {
  try {
    const [storyCount, userCount, totalReadsData, totalLikesData] = await Promise.all([
      Story.countDocuments({ status: 'published' }),
      User.countDocuments({ isActive: true }),
      Story.aggregate([{ $group: { _id: null, total: { $sum: "$readCount" } } }]),
      Story.aggregate([{ $group: { _id: null, total: { $sum: "$totalLikes" } } }])
    ]);

    res.json({
      success: true,
      stats: {
        totalStories: storyCount,
        totalAuthors: userCount,
        totalReads: totalReadsData[0]?.total || 0,
        totalLikes: totalLikesData[0]?.total || 0
      }
    });
  } catch (error) {
    console.error("Error fetching system stats:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const rateStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { rating } = req.body;
    const userId = req.user._id;

    const story = await Story.findById(storyId);
    if (!story) return res.status(404).json({ success: false, error: "Story not found" });

    const existingRateIndex = story.ratedBy.findIndex(r => r.userId.toString() === userId.toString());

    if (existingRateIndex > -1) {
      story.ratedBy[existingRateIndex].rating = rating;
    } else {
      story.ratedBy.push({ userId, rating });
    }

    const totalScore = story.ratedBy.reduce((sum, item) => sum + item.rating, 0);
    story.ratingAvg = totalScore / story.ratedBy.length;
    story.ratingCount = story.ratedBy.length;

    await story.save();

    res.json({
      success: true,
      ratingAvg: story.ratingAvg,
      ratingCount: story.ratingCount,
      userRating: rating
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Thêm route để lấy danh sách voices
export const getAvailableVoices = async (req, res) => {
  try {
    const { language } = req.params;

    // Danh sách voices tiếng Việt
    const vietnameseVoices = {
      'vi-VN-HoaiMyNeural': {
        name: 'Hoài My',
        gender: 'female',
        description: 'Giọng nữ miền Bắc, trẻ trung, trong sáng',
        locale: 'vi-VN'
      },
      'vi-VN-NamMinhNeural': {
        name: 'Nam Minh',
        gender: 'male',
        description: 'Giọng nam miền Bắc, ấm áp, thân thiện',
        locale: 'vi-VN'
      },
      'vi-VN-ThanhXuanNeural': {
        name: 'Thanh Xuân',
        gender: 'female',
        description: 'Giọng nữ miền Bắc, nhẹ nhàng, truyền cảm',
        locale: 'vi-VN'
      },
      'vi-VN-AnNeural': {
        name: 'An',
        gender: 'male',
        description: 'Giọng nam miền Nam, trầm ấm, dễ nghe',
        locale: 'vi-VN'
      },
      'vi-VN-HoaiMy': {
        name: 'Hoài My (Standard)',
        gender: 'female',
        description: 'Giọng nữ tiêu chuẩn, rõ ràng, dễ hiểu',
        locale: 'vi-VN'
      }
    };

    const voices = language === 'vi' ? vietnameseVoices : vietnameseVoices;

    res.json({
      success: true,
      voices: voices,
      count: Object.keys(voices).length
    });

  } catch (error) {
    console.error('Error fetching voices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available voices'
    });
  }
};

export const searchStories = async (req, res) => {
  try {
    const {
      q = "",
      page = 1,
      limit = 12,
      theme,
      ageGroup,
      sort = "newest"
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const queryParams = { page, limit, search: q, theme, ageGroup, sort };
    const cacheKey = `stories:search:${JSON.stringify(queryParams)}`;

    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }
    } catch (err) {
      console.warn("Redis get error:", err);
    }

    const query = { status: "published" };

    if (q && q.trim() !== "") {
      const searchRegex = { $regex: q, $options: "i" };
      query.$or = [
        { title: searchRegex },
        { tags: searchRegex }
      ];
    }

    if (theme && theme !== 'null') query.theme = theme;
    if (ageGroup && ageGroup !== 'null') query.ageGroup = ageGroup;

    let sortOption = { createdAt: -1 };
    if (sort === 'rating') sortOption = { ratingAvg: -1, totalLikes: -1 };
    else if (sort === 'popular') sortOption = { readCount: -1, totalLikes: -1 };
    else if (sort === 'oldest') sortOption = { createdAt: 1 };

    const [stories, totalStories] = await Promise.all([
      Story.find(query)
        .populate('userId', 'name pfp')
        .sort(sortOption)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Story.countDocuments(query)
    ]);

    const responseData = {
      success: true,
      stories,
      pagination: {
        current: pageNum,
        pageSize: limitNum,
        total: totalStories,
        totalPages: Math.ceil(totalStories / limitNum)
      }
    };

    try {
      if (totalStories > 0) {
        await redis.set(cacheKey, JSON.stringify(responseData), "EX", 300);
      }
    } catch (err) {
      console.warn("Redis set error:", err);
    }

    res.json(responseData);

  } catch (error) {
    console.error("Search API Error:", error);
    res.status(500).json({ success: false, error: "Lỗi hệ thống khi tìm kiếm" });
  }
};