import React, { useState, useEffect } from 'react';
import api from '../api';

// Utility: random pick n items from array (without duplicates)
function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

export default function Dashboard() {
  const [theme, setTheme] = useState('fairytale');

  // 9 Vietnamese words displayed as suggestions
  const [suggestedWords, setSuggestedWords] = useState([]);

  // Words that the user has clicked/selected to keep across refresh
  const [selectedWords, setSelectedWords] = useState([]);

  const [prompt, setPrompt] = useState('');

  const [generatedImages, setGeneratedImages] = useState([]);
  const [story, setStory] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null); // 🆕 Audio state
  const [generateAudio, setGenerateAudio] = useState(false); // 🆕 Audio checkbox

  const [loadingWords, setLoadingWords] = useState(false);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false); // 🆕 Audio loading

  // Store Vietnamese→English map for translation
  const [enMap, setEnMap] = useState({});

  // 🔸 Fetch and refresh 9 words. Preserve selected words.
  const fetchWords = async () => {
    setLoadingWords(true);
    try {
      const res = await api.get(`/themes/${theme}/words`);

      const viAll = [
        ...res.data.words.vietnamese.easy,
        ...res.data.words.vietnamese.medium,
        ...res.data.words.vietnamese.hard
      ];
      const enAll = [
        ...res.data.words.english.easy,
        ...res.data.words.english.medium,
        ...res.data.words.english.hard
      ];

      // Build Vietnamese→English map (assumes arrays match order)
      const map = {};
      viAll.forEach((vi, i) => { map[vi] = enAll[i]; });
      setEnMap(map);

      // Remove already selected from pool
      const remainingPool = viAll.filter(
        w => !selectedWords.some(sel => sel.toLowerCase() === w.toLowerCase())
      );

      // We always want 9 suggested words total, keeping selected ones
      const needed = Math.max(0, 9 - selectedWords.length);
      const newRandoms = pickRandom(remainingPool, needed);

      setSuggestedWords([...selectedWords, ...newRandoms]);
    } catch (err) {
      console.error('Lỗi lấy từ gợi ý:', err);
    } finally {
      setLoadingWords(false);
    }
  };

  // 🆕 Generate audio from story text
  const generateStoryAudio = async (storyText) => {
    if (!generateAudio || !storyText) return;
    
    setLoadingAudio(true);
    setAudioUrl(null);
    
    try {
      const response = await api.post('/generate-tts', {
        text: storyText,
        voice: 'vi-VN-HoaiMyNeural' // Vietnamese female voice
      }, {
        responseType: 'blob' // Important for audio blob
      });

      // Create blob URL for audio playback
      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(audioUrl);
      
    } catch (error) {
      console.error('Lỗi tạo audio:', error);
      alert('Không thể tạo audio. Vui lòng thử lại.');
    } finally {
      setLoadingAudio(false);
    }
  };

  // First load & whenever theme changes, reset
  useEffect(() => {
    setSelectedWords([]);
    setSuggestedWords([]);
    fetchWords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  // 🆕 Clean up audio URL when component unmounts
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // 🔸 Toggle word selection
  const toggleSelectWord = (word) => {
    setSelectedWords((prev) => {
      const lowerPrev = prev.map(w => w.toLowerCase());
      if (lowerPrev.includes(word.toLowerCase())) {
        // Unselect
        return prev.filter(w => w.toLowerCase() !== word.toLowerCase());
      } else {
        // Select
        return [...prev, word];
      }
    });
  };

  // 🔸 Add a suggested word to prompt text
  const addWordToPrompt = (word) => {
    const lowerPrompt = prompt.toLowerCase();
    if (!lowerPrompt.split(/\s|,/).includes(word.toLowerCase())) {
      setPrompt(prev => (prev ? prev + ' ' + word : word));
    }
  };

  // 🔸 Generate both images and story at the same time
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoadingGenerate(true);
    setGeneratedImages([]);
    setStory(null);
    setAudioUrl(null); // 🆕 Reset audio when generating new story

    try {
      // If no words selected, use all 9 suggested words
      const viKeywords = selectedWords.length > 0 ? selectedWords : suggestedWords;

      // Convert to English for image generator
      const enKeywords = viKeywords.map(vi => enMap[vi] || vi);

      console.log('Vietnamese keywords for story:', viKeywords);
      console.log('English keywords for image:', enKeywords);

      const [imgRes, storyRes] = await Promise.all([
        api.post('/generate-image', {
          prompt: 'realistic',
          steps: 20,
          numImages: 4,
          keywords: enKeywords       // ⬅️ English keywords
        }),
        api.post('/story', {         // 🆕 Uncommented story generation
          theme,
          keywords: viKeywords,      // ⬅️ Vietnamese keywords
          prompt
        })
      ]);

      setGeneratedImages(imgRes.data.imageUrls || []);
      setStory(storyRes.data);

      // 🆕 Generate audio if checkbox is checked
      if (generateAudio && storyRes.data.story) {
        await generateStoryAudio(storyRes.data.story);
      }

    } catch (err) {
      console.error('Error generating:', err);
      alert('Không thể tạo ảnh hoặc câu chuyện');
    } finally {
      setLoadingGenerate(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-10 space-y-10">
      {/* ====== Section: Suggested Words ====== */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-purple-600 mb-4">
          Từ gợi ý (9 từ tiếng Việt)
        </h2>

        <div className="flex items-center justify-between mb-4">
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            <option value="fairytale">Cổ tích</option>
            <option value="adventure">Phiêu lưu</option>
            <option value="animal">Động vật</option>
            <option value="science">Khoa học</option>
            <option value="nature">Thiên nhiên</option>
            <option value="music">Âm nhạc</option>
          </select>

          <button
            onClick={fetchWords}
            disabled={loadingWords}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
          >
            {loadingWords ? 'Đang làm mới...' : 'Làm mới từ'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {suggestedWords.map((word, idx) => {
            const selected = selectedWords.some(
              w => w.toLowerCase() === word.toLowerCase()
            );
            return (
              <button
                key={idx}
                onClick={() => toggleSelectWord(word)}
                onDoubleClick={() => addWordToPrompt(word)}
                className={`px-3 py-1 rounded-full border
                  ${selected
                    ? 'bg-purple-200 border-purple-400 text-purple-800'
                    : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'}
                `}
                title="Nhấp 1 lần để chọn / bỏ chọn. Nhấp đúp để chèn vào prompt."
              >
                {word}
              </button>
            );
          })}
        </div>

        <p className="text-sm text-gray-500 mt-2">
          • Click 1 lần để <strong>chọn / bỏ chọn</strong> từ (chọn sẽ giữ lại khi làm mới).<br />
          • Double click để <strong>chèn vào prompt</strong> bên dưới.
        </p>
      </div>

      {/* ====== Section: Prompt ====== */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-purple-600 mb-4">
          Prompt tạo ảnh & truyện
        </h2>
        
        {/* 🆕 Audio Generation Checkbox */}
        <div className="mb-4 flex items-center">
          <input
            type="checkbox"
            id="generateAudio"
            checked={generateAudio}
            onChange={(e) => setGenerateAudio(e.target.checked)}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <label htmlFor="generateAudio" className="ml-2 block text-sm text-gray-700">
            Tạo audio đọc truyện (tiếng Việt) - có thể mất thêm thời gian
          </label>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md
                     focus:ring-2 focus:ring-purple-500"
          placeholder="Hãy nhập hoặc thêm các từ gợi ý để tạo hình ảnh và câu chuyện..."
        />
        <button
          onClick={handleGenerate}
          disabled={loadingGenerate || !prompt.trim()}
          className="w-full mt-3 bg-purple-600 hover:bg-purple-700 text-white
                     py-2 px-4 rounded-md disabled:opacity-50"
        >
          {loadingGenerate ? 'Đang tạo ảnh & truyện...' : 'Tạo ảnh & truyện'}
        </button>
      </div>

      {/* ====== Section: Generated Images ====== */}
      {generatedImages.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-purple-700">Ảnh đã tạo:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {generatedImages.map((url, index) => (
              <div key={index} className="relative">
                <img
                  src={url}
                  alt={`Generated ${index}`}
                  className="w-full rounded-lg shadow-md"
                  onError={(e) => {
                    console.error(`Ảnh ${index} lỗi:`, url);
                    e.target.src = 'https://via.placeholder.com/400x300?text=Image+Failed';
                  }}
                />
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-2 right-2 bg-black bg-opacity-50
                             text-white text-xs px-2 py-1 rounded hover:bg-opacity-70"
                >
                  Xem gốc
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====== Section: Generated Story ====== */}
      {story && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-purple-600 mb-2">{story.title}</h2>
          <p className="italic text-gray-700 mb-4">{story.heading}</p>
          <p className="text-gray-800 whitespace-pre-line">{story.story}</p>
          
          {/* 🆕 Audio Player Section */}
          {generateAudio && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-600 mb-2">
                Audio đọc truyện
              </h3>
              {loadingAudio ? (
                <p className="text-gray-600">Đang tạo audio...</p>
              ) : audioUrl ? (
                <div className="flex items-center space-x-4">
                  <audio controls className="flex-1">
                    <source src={audioUrl} type="audio/mpeg" />
                    Trình duyệt của bạn không hỗ trợ audio.
                  </audio>
                  <a
                    href={audioUrl}
                    download="story-audio.mp3"
                    className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-sm"
                  >
                    Tải xuống
                  </a>
                </div>
              ) : (
                <p className="text-gray-600">Audio chưa sẵn sàng</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}