import React, { useState, useEffect } from 'react'
import { Checkbox, Slider, Input, message, Spin, Modal, Tag, Button, Row, Col, Card } from 'antd';
import "./CreateComic.scss";
import StoryModal from '../../components/StoryModal/StoryModal';
import axios from 'axios';

const { TextArea } = Input;

const CreateComic = () => {
  const [open, setOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedStory, setGeneratedStory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [suggestedKeywords, setSuggestedKeywords] = useState({
    vietnamese: { easy: [], medium: [], hard: [] },
    english: { easy: [], medium: [], hard: [] }
  });
  const [availableVoices, setAvailableVoices] = useState({});
  const [voicesLoading, setVoicesLoading] = useState(false);
  const [formData, setFormData] = useState({
    theme: '',
    keywords: [],
    pages: 3,
    prompt: '',
    addAudio: false,
    ageGroup: '6-8',
    selectedVoice: 'vi-VN-HoaiMyNeural'
  });
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [audioPlaying, setAudioPlaying] = useState(false);

  const genres = [
    { id: 'animal', label: 'Động vật', icon: '🐾' },
    { id: 'fairytale', label: 'Cổ tích', icon: '🏰' },
    { id: 'adventure', label: 'Phiêu lưu', icon: '🗺️' },
    { id: 'science', label: 'Khoa học', icon: '🔬' },
    { id: 'nature', label: 'Thiên nhiên', icon: '🌳' },
    { id: 'music', label: 'Âm nhạc', icon: '🎵' },
  ];

  const ageGroups = [
    { value: '3-5', label: '3-5 tuổi', description: 'Truyện ngắn, từ ngữ đơn giản' },
    { value: '6-8', label: '6-8 tuổi', description: 'Truyện vừa, nội dung giáo dục' },
    { value: '9-12', label: '9-12 tuổi', description: 'Truyện dài, nội dung phong phú' }
  ];

  const fetchAvailableVoices = async () => {
    setVoicesLoading(true);
    try {
      const response = await axios.get('/api/voices/vi');

      if (response.data.success && response.data.voices) {
        setAvailableVoices(response.data.voices);

        if (response.data.count > 0 && !formData.selectedVoice) {
          const firstVoice = Object.keys(response.data.voices)[0];
          handleInputChange('selectedVoice', firstVoice);
        }
      }
    } catch (error) {
      message.error('Không thể tải danh sách giọng đọc');
      setAvailableVoices({});
    } finally {
      setVoicesLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableVoices();
  }, []);

  useEffect(() => {
    const fetchSuggestedKeywords = async () => {
      if (!selectedGenre) {
        setSuggestedKeywords({
          vietnamese: { easy: [], medium: [], hard: [] },
          english: { easy: [], medium: [], hard: [] }
        });
        return;
      }

      try {
        const response = await axios.get(`/api/themes/${selectedGenre}/keywords`);

        if (response.data.words) {
          setSuggestedKeywords(response.data.words);
        }
      } catch (error) {
        message.error('Không thể tải gợi ý từ khóa');
      }
    };

    fetchSuggestedKeywords();
  }, [selectedGenre]);

  const handleGenreSelect = (genre) => {
    setSelectedGenre(genre.id);
    setFormData(prev => ({
      ...prev,
      theme: genre.id
    }));
    setSelectedKeywords([]);
  };

  const handleKeywordSelect = (keyword) => {
    setSelectedKeywords(prev => {
      if (prev.includes(keyword)) {
        return prev.filter(k => k !== keyword);
      } else {
        return [...prev, keyword];
      }
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const testVoice = async (voiceId = formData.selectedVoice) => {
    if (!voiceId) {
      message.warning('Vui lòng chọn giọng đọc trước');
      return;
    }

    setAudioPlaying(true);
    try {
      const testText = "Xin chào! Đây là giọng đọc thử nghiệm cho truyện của bạn.";
      const response = await axios.post('http://localhost:5001/tts', {
        text: testText,
        voice: voiceId
      }, {
        responseType: 'blob',
        timeout: 30000,
      });

      const audioUrl = URL.createObjectURL(response.data);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        setAudioPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setAudioPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();

    } catch (error) {
      setAudioPlaying(false);
      message.error('Không thể thử nghiệm giọng đọc');
    }
  };

  const generateStory = async () => {
    if (!formData.theme && !formData.prompt) {
      message.error('Vui lòng chọn thể loại hoặc nhập ý tưởng truyện');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        theme: formData.theme,
        keywords: selectedKeywords,
        pages: formData.pages,
        prompt: formData.prompt,
        ageGroup: formData.ageGroup,
        includeAudio: formData.addAudio,
        voice: formData.addAudio ? formData.selectedVoice : undefined
      };

      const token = localStorage.getItem('token');

      const response = await axios.post('/api/stories/generate', payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000
      });

      if (response.data.success) {
        setGeneratedStory(response.data.data || response.data);
        message.success('Tạo truyện thành công!');
        setPreviewModalOpen(true);
      } else {
        throw new Error(response.data.error || 'Failed to generate story');
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo truyện');
    } finally {
      setLoading(false);
    }
  };

  const saveStory = async (status = 'published') => {
    if (!generatedStory) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `/api/stories/${generatedStory.storyId}/save`,
        { status },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        message.success(status === 'published' ? 'Đã xuất bản truyện!' : 'Đã lưu truyện vào bản nháp!');
        setPreviewModalOpen(false);
        setGeneratedStory(null);
      }
    } catch (error) {
      message.error('Có lỗi khi lưu truyện');
    } finally {
      setSaving(false);
    }
  };

  const retryGeneration = () => {
    setPreviewModalOpen(false);
    generateStory();
  };

  const refreshKeywords = async () => {
    if (!selectedGenre) return;

    try {
      const response = await axios.get(`/api/themes/${selectedGenre}/keywords`);

      if (response.data.words) {
        setSuggestedKeywords(response.data.words);
        setSelectedKeywords([]);
        message.success('Đã làm mới gợi ý từ khóa!');
      }
    } catch (error) {
      message.error('Không thể làm mới từ khóa');
    }
  };

  const refreshVoices = async () => {
    await fetchAvailableVoices();
  };

  const renderVoiceCards = () => {
    if (voicesLoading) {
      return (
        <div className="voices-loading">
          <Spin size="small" />
          <span>Đang tải giọng đọc...</span>
        </div>
      );
    }

    if (Object.keys(availableVoices).length === 0) {
      return (
        <div className="no-voices">
          <p>Không có giọng đọc nào khả dụng</p>
        </div>
      );
    }

    return Object.entries(availableVoices).map(([voiceId, voiceInfo]) => (
      <Card
        key={voiceId}
        className={`voice-card ${formData.selectedVoice === voiceId ? 'selected' : ''}`}
        onClick={() => handleInputChange('selectedVoice', voiceId)}
        size="small"
      >
        <div className="voice-card-content">
          <div className="voice-header">
            <div className="voice-avatar">
              {voiceInfo.gender === 'female' ? '👩' : '👨'}
            </div>
            <div className="voice-info">
              <div className="voice-name">
                <strong>{voiceInfo.name}</strong>
              </div>
              <div className="voice-type">
                {voiceInfo.gender === 'female' ? 'Nữ' : 'Nam'}
              </div>
            </div>
          </div>

          <div className="voice-description">
            {voiceInfo.description}
          </div>

          <div className="voice-actions">
            <Button
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                testVoice(voiceId);
              }}
              loading={audioPlaying && formData.selectedVoice === voiceId}
            >
              Nghe thử
            </Button>
          </div>
        </div>
      </Card>
    ));
  };

  return (
    <>
      <div className="create-comic">
        <div className="create-comic__header">
          <h1>TOON KIDZ</h1>
          <h2>Tạo truyện AI</h2>
          <div className="header-description">
            <p className="description-text">
              Sáng tạo những câu chuyện kỳ diệu cho con em bạn bằng sức mạnh của AI.
              Chỉ cần vài bước đơn giản, bạn sẽ có một truyện tranh đầy đủ với hình ảnh,
              nội dung và audio đọc chuyên nghiệp.
            </p>
            <div className="guides">
              <div className="guide-item">
                <div className="guide-icon">🎨</div>
                <div className="guide-title">Chọn Thể Loại</div>
                <div className="guide-text">Lựa chọn từ 6 thể loại truyện phong phú phù hợp với sở thích của bé</div>
              </div>
              <div className="guide-item">
                <div className="guide-icon">⚙️</div>
                <div className="guide-title">Tuỳ Chỉnh Chi Tiết</div>
                <div className="guide-text">Chọn độ tuổi, từ khóa, độ dài truyện và giọng đọc yêu thích</div>
              </div>
              <div className="guide-item">
                <div className="guide-icon">✨</div>
                <div className="guide-title">Tạo & Xuất Bản</div>
                <div className="guide-text">Xem trước, chỉnh sửa và xuất bản truyện của bạn trong vài giây</div>
              </div>
            </div>
          </div>
        </div>

        <div className="create-comic__main">
          <div className="create-comic__main__left">
            <div className="create-comic__section">
              <h2>Chọn thể loại truyện</h2>
              <div className="genre-grid">
                {genres.map(genre => (
                  <div
                    key={genre.id}
                    className={`genre-card ${selectedGenre === genre.id ? 'active' : ''}`}
                    onClick={() => handleGenreSelect(genre)}
                  >
                    <div className="genre-icon">{genre.icon}</div>
                    <div className="genre-label">{genre.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="create-comic__section">
              <h2>Cài đặt truyện</h2>

              {selectedGenre && (
                <div className="setting-group">
                  <div className="keywords-header">
                    <label>Từ khóa gợi ý cho {genres.find(g => g.id === selectedGenre)?.label}:</label>
                    <Button
                      size="small"
                      onClick={refreshKeywords}
                    >
                      Làm mới
                    </Button>
                  </div>

                  {suggestedKeywords.vietnamese.easy.length > 0 && (
                    <div className="keyword-section">
                      <div className="keyword-section-title">
                        Dễ (3-5 tuổi)
                      </div>
                      <div className="keywords-container">
                        {suggestedKeywords.vietnamese.easy.map((keyword) => (
                          <Tag
                            key={keyword}
                            color={selectedKeywords.includes(keyword) ? 'green' : 'default'}
                            onClick={() => handleKeywordSelect(keyword)}
                            className="keyword-tag"
                          >
                            {keyword}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}

                  {suggestedKeywords.vietnamese.medium.length > 0 && (
                    <div className="keyword-section">
                      <div className="keyword-section-title">
                        Trung bình (6-8 tuổi)
                      </div>
                      <div className="keywords-container">
                        {suggestedKeywords.vietnamese.medium.map((keyword) => (
                          <Tag
                            key={keyword}
                            color={selectedKeywords.includes(keyword) ? 'blue' : 'default'}
                            onClick={() => handleKeywordSelect(keyword)}
                            className="keyword-tag"
                          >
                            {keyword}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}

                  {suggestedKeywords.vietnamese.hard.length > 0 && (
                    <div className="keyword-section">
                      <div className="keyword-section-title">
                        Khó (9-12 tuổi)
                      </div>
                      <div className="keywords-container">
                        {suggestedKeywords.vietnamese.hard.map((keyword) => (
                          <Tag
                            key={keyword}
                            color={selectedKeywords.includes(keyword) ? 'orange' : 'default'}
                            onClick={() => handleKeywordSelect(keyword)}
                            className="keyword-tag"
                          >
                            {keyword}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedKeywords.length > 0 && (
                    <div className="selected-keywords-info">
                      <div className="selected-count">
                        <strong>Đã chọn {selectedKeywords.length} từ khóa:</strong>
                      </div>
                      <div className="selected-list">
                        {selectedKeywords.map(keyword => (
                          <Tag
                            key={keyword}
                            color="purple"
                            closable
                            onClose={() => handleKeywordSelect(keyword)}
                          >
                            {keyword}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="setting-group">
                <label>Độ tuổi phù hợp:</label>
                <div className="age-group-cards">
                  {ageGroups.map(age => (
                    <div
                      key={age.value}
                      className={`age-card ${formData.ageGroup === age.value ? 'active' : ''}`}
                      onClick={() => handleInputChange('ageGroup', age.value)}
                    >
                      <div className="age-label">{age.label}</div>
                      <div className="age-description">{age.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="setting-group">
                <label>Độ dài truyện: <strong>{formData.pages} trang</strong></label>
                <Slider
                  min={1}
                  max={7}
                  value={formData.pages}
                  onChange={(value) => handleInputChange('pages', value)}
                />
                <div className="slider-labels">
                  <span>Ngắn</span>
                  <span>Vừa</span>
                  <span>Dài</span>
                </div>
              </div>

              <div className="setting-group">
                <div className="audio-checkbox">
                  <Checkbox
                    checked={formData.addAudio}
                    onChange={(e) => handleInputChange('addAudio', e.target.checked)}
                  >
                    <span className="audio-label">Thêm audio đọc truyện</span>
                  </Checkbox>
                </div>

                {formData.addAudio && (
                  <div className="voice-selection-section">
                    <div className="section-header">
                      <div className="section-title">Chọn giọng đọc:</div>
                      <Button
                        size="small"
                        onClick={refreshVoices}
                        loading={voicesLoading}
                      >
                        Làm mới
                      </Button>
                    </div>

                    <div className="voice-cards-grid">
                      {renderVoiceCards()}
                    </div>

                    {formData.selectedVoice && availableVoices[formData.selectedVoice] && (
                      <div className="selected-voice-info">
                        <div className="selected-voice-badge">
                          <strong>Đã chọn: {availableVoices[formData.selectedVoice].name}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="setting-group">
                <label>Ý tưởng của bạn (tùy chọn):</label>
                <TextArea
                  rows={4}
                  placeholder="Ví dụ: Một chú thỏ ham chơi và một chú rùa chăm chỉ tham gia cuộc đua trong rừng..."
                  value={formData.prompt}
                  onChange={(e) => handleInputChange('prompt', e.target.value)}
                  maxLength={500}
                  showCount
                />
              </div>

              <Button
                type="primary"
                size="large"
                onClick={generateStory}
                loading={loading}
                disabled={(!formData.theme && !formData.prompt) || loading}
                className="generate-btn"
              >
                {loading ? 'Đang tạo truyện...' : 'Tạo truyện ngay'}
              </Button>
            </div>
          </div>

          <div className="create-comic__preview">
            <div className="preview-card">
              <h3>Xem trước</h3>

              {generatedStory ? (
                <div className="preview-content">
                  <div className="preview-cover">
                    <img
                      src={generatedStory.coverImage || '/default-cover.jpg'}
                      alt={generatedStory.title}
                      onError={(e) => {
                        e.target.src = '/default-cover.jpg';
                      }}
                    />
                  </div>
                  <div className="preview-info">
                    <h4>{generatedStory.title || 'Tiêu đề truyện'}</h4>
                    <p className="preview-heading">{generatedStory.heading || 'Mô tả ngắn về truyện'}</p>
                    <div className="preview-meta">
                      <Tag color="blue">{formData.ageGroup} tuổi</Tag>
                      <Tag color="green">{generatedStory.pages?.length || formData.pages} trang</Tag>
                      <Tag color="orange">{Math.ceil((generatedStory.pages?.length || formData.pages) * 0.5)} phút</Tag>
                      {formData.addAudio && <Tag color="purple">Có audio</Tag>}
                    </div>
                  </div>
                  <div className="preview-actions">
                    <Button
                      type="primary"
                      onClick={() => setPreviewModalOpen(true)}
                    >
                      Xem chi tiết
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="preview-placeholder">
                  <div className="placeholder-icon">📖</div>
                  <p>Truyện của bạn sẽ xuất hiện ở đây</p>
                  <small>Chọn thể loại và nhấn "Tạo truyện ngay"</small>
                </div>
              )}
            </div>

            <div className="stats-card">
              <h4>Thống kê</h4>
              <div className="stats-grid">
                <div className="stat">
                  <div className="stat-value">{selectedKeywords.length}</div>
                  <div className="stat-label">Từ khóa</div>
                </div>
                <div className="stat">
                  <div className="stat-value">{formData.pages}</div>
                  <div className="stat-label">Trang</div>
                </div>
                <div className="stat">
                  <div className="stat-value">{formData.ageGroup}</div>
                  <div className="stat-label">Độ tuổi</div>
                </div>
              </div>
              {formData.addAudio && formData.selectedVoice && availableVoices[formData.selectedVoice] && (
                <div className="audio-info">
                  <Tag color="green">Giọng: {availableVoices[formData.selectedVoice].name}</Tag>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        title="Xem trước truyện"
        open={previewModalOpen}
        onCancel={() => setPreviewModalOpen(false)}
        footer={null}
        width={1000}
      >
        {generatedStory && (
          <div className="preview-modal-content">
            <div className="preview-header">
              <img
                src={generatedStory.coverImage || '/default-cover.jpg'}
                alt={generatedStory.title}
                onError={(e) => {
                  e.target.src = '/default-cover.jpg';
                }}
              />
              <div className="preview-header-info">
                <h2>{generatedStory.title || 'Tiêu đề truyện'}</h2>
                <p>{generatedStory.heading || 'Mô tả truyện'}</p>
                <div className="preview-tags">
                  <Tag color="blue">Thể loại: {formData.theme}</Tag>
                  <Tag color="green">Độ tuổi: {formData.ageGroup}</Tag>
                  <Tag color="orange">{generatedStory.pages?.length || 0} trang</Tag>
                </div>
              </div>
            </div>

            <div className="preview-pages">
              <h3>Nội dung truyện:</h3>
              <div className="pages-grid">
                {generatedStory.pages?.map((page, index) => (
                  <div key={index} className="page-preview">
                    <div className="page-number">Trang {page.pageNumber || index + 1}</div>
                    <div className="page-image">
                      <img
                        src={page.image || '/default-page.jpg'}
                        alt={`Page ${page.pageNumber || index + 1}`}
                        onError={(e) => {
                          e.target.src = '/default-page.jpg';
                        }}
                      />
                    </div>
                    <div className="page-content">
                      <p>{page.content || 'Nội dung trang...'}</p>
                    </div>
                  </div>
                )) || (
                    <div className="no-pages">
                      <p>Chưa có nội dung trang nào được tạo.</p>
                    </div>
                  )}
              </div>
            </div>

            <div className="preview-actions">
              <Row gutter={16} justify="center">
                <Col>
                  <Button
                    type="primary"
                    size="large"
                    loading={saving}
                    onClick={() => saveStory('published')}
                  >
                    Xuất bản ngay
                  </Button>
                </Col>
                <Col>
                  <Button
                    size="large"
                    loading={saving}
                    onClick={() => saveStory('draft')}
                  >
                    Lưu bản nháp
                  </Button>
                </Col>
                <Col>
                  <Button
                    size="large"
                    onClick={retryGeneration}
                    loading={loading}
                  >
                    Tạo lại
                  </Button>
                </Col>
              </Row>
            </div>
          </div>
        )}
      </Modal>

      <StoryModal
        open={open}
        onClose={() => setOpen(false)}
        story={generatedStory}
        loading={loading}
      />
    </>
  )
}

export default CreateComic;