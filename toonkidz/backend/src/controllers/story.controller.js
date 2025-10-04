import axios from 'axios';
import { AI_MODELS, AI_RETRY_OPTIONS } from '../config/ai.config.js';
import themes from "../config/theme.config.js"

export const generateStory = async (req, res) => {
  const { theme, keywords, prompt: userPrompt } = req.body;

  // ✅ 1️⃣ Require at least a theme or a user prompt
  if (!theme && !userPrompt) {
    return res.status(400).json({ error: 'Theme or prompt is required' });
  }

  const storyKeywords = Array.isArray(keywords) && keywords.length > 0 ? keywords : [];

  // ✅ 2️⃣ Build the instruction
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
3. Câu chuyện: Khoảng 10 từ, viết bằng ngôn ngữ đơn giản, dễ hiểu cho trẻ em từ 5-10 tuổi.
4. Kết cấu câu chuyện rõ ràng: mở đầu, diễn biến, kết thúc, không cần ghi rõ ra.

ĐỊNH DẠNG ĐẦU RA (JSON):
{
  "title": "Tiêu đề câu chuyện",
  "heading": "Tóm tắt ngắn gọn",
  "story": "Nội dung câu chuyện đầy đủ..."
}

Lưu ý:
- Viết toàn bộ câu chuyện bằng tiếng Việt tự nhiên.
- Ưu tiên tuyệt đối ý tưởng do người dùng gõ (*${userPrompt || theme}*).
- Sử dụng từ khóa một cách tự nhiên, không gượng ép.
- Câu chuyện có tính giáo dục, vui vẻ và phù hợp với trẻ em.
`;

  const sortedModels = AI_MODELS.sort((a, b) => a.priority - b.priority);

  for (const model of sortedModels) {
    let attempt = 0;

    while (attempt < (AI_RETRY_OPTIONS.maxRetries || 1)) {
      try {
        let storyText = '';

        // 🆕 REPLICATE INTEGRATION (Claude 3.7 Sonnet)
        if (model.provider === 'replicate') {
          const response = await axios.post(
            model.endpoint,
            {
              input: {
                prompt: prompt,
                system_prompt: "Bạn là một nhà văn chuyên viết truyện thiếu nhi. Hãy viết câu chuyện bằng tiếng Việt.",
                max_tokens: 1200,
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
          
          // Replicate responses are often async, check for completion
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

        // DEEPSEEK INTEGRATION
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
              max_tokens: 1200,
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

        // GOOGLE GEMINI INTEGRATION
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
                max_output_tokens: 1500
              }
            },
            {
              headers: { 'Content-Type': 'application/json' },
              timeout: AI_RETRY_OPTIONS.timeoutMs
            }
          );
          storyText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }

        // HUGGINGFACE INTEGRATION
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
              max_tokens: 1500
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

        // POLLINATIONS INTEGRATION
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

        // Ensure storyText is always a string
        storyText = String(storyText || '');

        if (!storyText || storyText.trim() === '') throw new Error('Empty response from AI');

        let result;
        try {
          result = JSON.parse(storyText);
        } catch {
          // fallback parsing logic
          const lines = storyText.split('\n').map(l => l.trim()).filter(Boolean);
          let title = '', heading = '', story = '';
          lines.forEach(line => {
            const lower = line.toLowerCase();
            if (!title && (lower.startsWith('title:') || lower.startsWith('tiêu đề:')))
              title = line.replace(/title:|tiêu đề:/i, '').trim();
            else if (!heading && (lower.startsWith('heading:') || lower.startsWith('tóm tắt:') || lower.startsWith('summary:')))
              heading = line.replace(/heading:|tóm tắt:|summary:/i, '').trim();
            else if (!story && (lower.startsWith('story:') || lower.startsWith('câu chuyện:') || lower.startsWith('nội dung:')))
              story = line.replace(/story:|câu chuyện:|nội dung:/i, '').trim();
          });

          if (!story) story = lines.join(' ');
          if (!title) title = `Câu chuyện về ${theme}`;
          if (!heading) heading = 'Một câu chuyện thú vị dành cho trẻ em';
          if (!story) story = storyText;

          result = { title, heading, story };
        }

        return res.json({
          ...result,
          keywords: storyKeywords,
          theme: theme,
          model_used: model.name // Track which model succeeded
        });

      } catch (err) {
        console.warn(`Attempt ${attempt + 1} failed for model ${model.name}:`, err.message);
        
        // 🆕 AUTOMATIC MODEL SWITCHING CONDITIONS
        const errorMessage = err.message?.toLowerCase() || '';
        const responseData = err.response?.data;
        
        // Check for token limits, quota exceeded, or rate limits
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
          break; // Break out of retry loop and move to next model
        }

        if (err.response) {
          console.warn('Error response data:', err.response.data);
        }
        attempt++;
      }
    }

    console.warn(`Model ${model.name} failed all attempts, trying next model...`);
  }

  return res.status(500).json({ 
    error: 'All AI models failed to generate story',
    message: 'Xin lỗi, tất cả các dịch vụ AI hiện đang gặp sự cố. Vui lòng thử lại sau.'
  });
};