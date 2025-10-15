//story.controller.js
import axios from 'axios';
import { AI_MODELS, AI_RETRY_OPTIONS } from '../config/ai.config.js';
import Story from '../models/story.model.js';
import cloudinary from "../lib/cloudinary.js";
import fs from "fs";

export const generateStory = async (req, res) => {
  const { theme, keywords, prompt: userPrompt } = req.body;
  const userId = req.user._id;

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

YÊU CẦU:
1. Tiêu đề: Một dòng ngắn gọn, hấp dẫn.
2. Tóm tắt: Một hoặc hai câu mô tả nội dung chính của câu chuyện, không chứa "một câu chuyện...".
3. Câu chuyện: Chia thành 2 trang, mỗi trang khoảng 20 từ.
4. Mỗi trang phải có nội dung hoàn chỉnh và liên kết với trang trước/sau.
5. Kết cấu câu chuyện rõ ràng: mở đầu, diễn biến, kết thúc.

ĐỊNH DẠNG ĐẦU RA (JSON):
{
  "title": "Tiêu đề câu chuyện",
  "heading": "Tóm tắt ngắn gọn",
  "pages": [
    {
      "pageNumber": 1,
      "content": "Nội dung trang 1..."
    },
    {
      "pageNumber": 2,
      "content": "Nội dung trang 2..."
    }
  ]
}

Lưu ý:
- Viết toàn bộ câu chuyện bằng tiếng Việt tự nhiên.
- Ưu tiên tuyệt đối ý tưởng do người dùng gõ (*${userPrompt || theme}*).
- Sử dụng từ khóa một cách tự nhiên, không gượng ép.
- Câu chuyện có tính giáo dục, vui vẻ và phù hợp với trẻ em.
- Chia câu chuyện thành các trang hợp lý, mỗi trang là một phần của cốt truyện.
`;

  const sortedModels = AI_MODELS.sort((a, b) => a.priority - b.priority);

  for (const model of sortedModels) {
    let attempt = 0;

    while (attempt < (AI_RETRY_OPTIONS.maxRetries || 1)) {
      try {
        let storyText = '';

        // Generate story content
        if (model.provider === 'replicate') {
          const response = await axios.post(
            model.endpoint,
            {
              input: {
                prompt: prompt,
                system_prompt: "Bạn là một nhà văn chuyên viết truyện thiếu nhi. Hãy viết câu chuyện bằng tiếng Việt với cấu trúc trang rõ ràng.",
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

        let result;
        try {
          result = JSON.parse(storyText);
        } catch {
          result = await parseNonJSONResponse(storyText, theme);
        }

        if (!result.pages || !Array.isArray(result.pages)) {
          throw new Error('Invalid response format: missing pages array');
        }

        // Create pages without images
        const pages = result.pages.map((page, index) => ({
          pageNumber: page.pageNumber || index + 1,
          content: page.content
          // No image field - images will be handled separately by frontend
        }));

        // Save to database without images
        const storyData = {
          theme: theme || 'custom',
          title: result.title || `Câu chuyện về ${theme}`,
          head: result.heading || 'Một câu chuyện thú vị dành cho trẻ em',
          content: pages.map(page => page.content).join('\n\n'),
          pages: pages,
          userId: userId,
          status: 'generated', // Story content generated, images pending
          tags: storyKeywords.join(', '),
          readingTime: Math.ceil(pages.length * 0.5),
          ageGroup: '6-8',
          language: 'vi'
        };

        const savedStory = await Story.create(storyData);

        //Return story without images
        return res.json({
          success: true,
          storyId: savedStory._id,
          title: savedStory.title,
          heading: savedStory.head,
          pages: savedStory.pages,
          theme: savedStory.theme,
          keywords: storyKeywords,
          model_used: model.name
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

//Helper function to parse non-JSON responses
async function parseNonJSONResponse(storyText, theme) {
  const lines = storyText.split('\n').map(l => l.trim()).filter(Boolean);

  let title = '';
  let heading = '';
  const pages = [];
  let currentPage = null;

  for (const line of lines) {
    const lower = line.toLowerCase();

    if (lower.startsWith('title:') || lower.startsWith('tiêu đề:')) {
      title = line.replace(/title:|tiêu đề:/i, '').trim();
    } else if (lower.startsWith('heading:') || lower.startsWith('tóm tắt:') || lower.startsWith('summary:')) {
      heading = line.replace(/heading:|tóm tắt:|summary:/i, '').trim();
    } else if (lower.startsWith('page') || lower.startsWith('trang')) {
      if (currentPage) {
        pages.push(currentPage);
      }
      const pageMatch = line.match(/(\d+)/);
      const pageNumber = pageMatch ? parseInt(pageMatch[1]) : pages.length + 1;
      currentPage = {
        pageNumber,
        content: ''
      };
    } else if (currentPage) {
      currentPage.content += (currentPage.content ? ' ' : '') + line;
    }
  }

  if (currentPage) {
    pages.push(currentPage);
  }

  if (pages.length === 0) {
    const content = lines.join(' ');
    pages.push({
      pageNumber: 1,
      content: content
    });
  }

  if (!title) title = `Câu chuyện về ${theme}`;
  if (!heading) heading = 'Một câu chuyện thú vị dành cho trẻ em';

  return { title, heading, pages };
}

//Function to update story with images (called by frontend after image generation)
export const updateStoryWithImages = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { pages } = req.body; // Array of pages with image URLs from frontend

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    // Update pages with image URLs from frontend
    story.pages = story.pages.map((page, index) => ({
      ...page.toObject(),
      image: pages[index]?.image || '' // Add image URL to each page
    }));

    // Update status to completed when images are added
    story.status = 'completed';

    await story.save();

    res.json({
      success: true,
      message: 'Story updated with images successfully',
      story: {
        id: story._id,
        title: story.title,
        pages: story.pages
      }
    });
  } catch (error) {
    console.error('Error updating story with images:', error);
    res.status(500).json({ error: 'Failed to update story with images' });
  }
};

//Function to get story by ID
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


//Create story
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

      // Upload ảnh
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

    return res.status(201).json({ success: true, story });
  } catch (error) {
    console.error("Error creating story:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

//Get all stories
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

// Get Story By ID
export const getStoryById = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id).populate('userId', 'name email');
    if (!story) {
      return res.status(404).json({ success: false, error: 'Story not found' });
    }
    res.json({ success: true, story });
  } catch (error) {
    console.error('Error fetching story by ID:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch story' });
  }
};

//Update Story
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
      fs.unlinkSync(coverPath); // Xóa file tạm
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
    return res.status(200).json({ success: true, story: savedStory });

  } catch (error) {
    console.error("Error updating story:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

//Delete Story
export const deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({ success: false, error: 'Story not found' });
    }

    // (Bonus) Xóa ảnh bìa và ảnh các trang trên Cloudinary
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

    res.json({ success: true, message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Error deleting story:', error);
    res.status(500).json({ success: false, error: 'Failed to delete story' });
  }
};

export const getMyStories = async (req, res) => {
  try {
    // req.user._id được cung cấp bởi middleware `auth`
    const userId = req.user._id;

    const stories = await Story.find({ userId: userId })
      .sort({ createdAt: -1 }); // Sắp xếp truyện mới nhất lên đầu

    if (!stories) {
      return res.status(404).json({ success: false, error: 'No stories found for this user' });
    }

    res.json({ success: true, stories });
  } catch (error) {
    console.error('Error fetching user stories:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user stories' });
  }
};
