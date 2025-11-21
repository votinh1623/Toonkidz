import React, { useState } from 'react'
import { Checkbox, Slider, Input, message, Spin, Modal, Tag, Button, Row, Col } from 'antd';
import { SaveOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
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
  const [formData, setFormData] = useState({
    theme: '',
    keywords: [],
    pages: 3,
    prompt: '',
    addAudio: false,
    ageGroup: '6-8'
  });
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');

  const genres = [
    { id: 'fairytale', label: 'Cổ tích', icon: '🏰', keywords: ['công chúa', 'hoàng tử', 'lâu đài', 'phép thuật', 'tiên'] },
    { id: 'adventure', label: 'Phiêu lưu', icon: '🗺️', keywords: ['khám phá', 'bản đồ', 'kho báu', 'thử thách', 'hành trình'] },
    { id: 'animal', label: 'Động vật', icon: '🐾', keywords: ['thỏ', 'rùa', 'mèo', 'chó', 'chim', 'cá'] },
    { id: 'science', label: 'Khoa học', icon: '🔬', keywords: ['vũ trụ', 'robot', 'phát minh', 'thí nghiệm', 'khám phá'] },
    { id: 'nature', label: 'Thiên nhiên', icon: '🌳', keywords: ['rừng', 'cây', 'hoa', 'con sông', 'núi', 'biển'] },
    { id: 'music', label: 'Âm nhạc', icon: '🎵', keywords: ['nhạc cụ', 'bài hát', 'vũ điệu', 'âm thanh', 'giai điệu'] },
  ];

  const ageGroups = [
    { value: '3-5', label: '3-5 tuổi', description: 'Truyện ngắn, từ ngữ đơn giản' },
    { value: '6-8', label: '6-8 tuổi', description: 'Truyện vừa, nội dung giáo dục' },
    { value: '9-12', label: '9-12 tuổi', description: 'Truyện dài, nội dung phong phú' }
  ];

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
        ageGroup: formData.ageGroup
      };

      const token = localStorage.getItem('token');

      const response = await axios.post('/api/stories/generate', payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 300000
      });

      if (response.data.success) {
        setGeneratedStory(response.data);
        message.success('Tạo truyện thành công! Bạn có thể xem trước và lưu lại.');
        setPreviewModalOpen(true);
      } else {
        throw new Error(response.data.error || 'Failed to generate story');
      }
    } catch (error) {
      console.error('Error generating story:', error);
      message.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo truyện. Vui lòng thử lại.');
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
      console.error('Error saving story:', error);
      message.error('Có lỗi khi lưu truyện. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const retryGeneration = () => {
    setPreviewModalOpen(false);
    generateStory();
  };

  const getCurrentKeywords = () => {
    const genre = genres.find(g => g.id === selectedGenre);
    return genre ? genre.keywords : [];
  };

  const getSelectedGenre = () => {
    return genres.find(g => g.id === selectedGenre);
  };

  return (
    <>
      <div className="create-comic">
        {/* Hero Section */}
        <div className="create-comic__hero">
          <div className="create-comic__hero-content">
            <h1>Tạo Truyện Tranh với AI</h1>
            <p>Biến ý tưởng thành truyện tranh sống động chỉ trong vài phút. AI sẽ giúp bạn sáng tạo câu chuyện độc đáo cho bé!</p>
            <div className="hero-features">
              <div className="feature">
                <span>🚀</span>
                <span>Nhanh chóng</span>
              </div>
              <div className="feature">
                <span>🎨</span>
                <span>Hình ảnh đẹp</span>
              </div>
              <div className="feature">
                <span>📚</span>
                <span>Giáo dục</span>
              </div>
            </div>
          </div>
        </div>

        <div className="create-comic__main">
          <div className="create-comic__main__left">
            {/* Genre Selection */}
            <div className="create-comic__section">
              <h2>🎭 Chọn thể loại truyện</h2>
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

            {/* Story Settings */}
            <div className="create-comic__section">
              <h2>⚙️ Cài đặt truyện</h2>

              {selectedGenre && (
                <div className="setting-group">
                  <label>Từ khóa cho {getSelectedGenre()?.label}:</label>
                  <div className="keywords-container">
                    {getCurrentKeywords().map(keyword => (
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
                  trackStyle={{ background: '#1890ff' }}
                  handleStyle={{ borderColor: '#1890ff' }}
                />
                <div className="slider-labels">
                  <span>Ngắn</span>
                  <span>Vừa</span>
                  <span>Dài</span>
                </div>
              </div>

              <div className="setting-group">
                <label>
                  <Checkbox
                    checked={formData.addAudio}
                    onChange={(e) => handleInputChange('addAudio', e.target.checked)}
                  >
                    🎵 Thêm audio đọc truyện
                  </Checkbox>
                </label>
              </div>

              <div className="setting-group">
                <label>💡 Ý tưởng của bạn (tùy chọn):</label>
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
                icon={<ReloadOutlined />}
              >
                {loading ? 'Đang tạo truyện...' : '🎨 Tạo truyện ngay'}
              </Button>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="create-comic__preview">
            <div className="preview-card">
              <h3>👁️ Xem trước</h3>

              {generatedStory ? (
                <div className="preview-content">
                  <div className="preview-cover">
                    <img src={generatedStory.coverImage} alt={generatedStory.title} />
                  </div>
                  <div className="preview-info">
                    <h4>{generatedStory.title}</h4>
                    <p className="preview-heading">{generatedStory.heading}</p>
                    <div className="preview-meta">
                      <Tag color="blue">{formData.ageGroup} tuổi</Tag>
                      <Tag color="green">{generatedStory.pages?.length || formData.pages} trang</Tag>
                      <Tag color="orange">{Math.ceil((generatedStory.pages?.length || formData.pages) * 0.5)} phút</Tag>
                    </div>
                  </div>
                  <div className="preview-actions">
                    <Button
                      type="primary"
                      icon={<EyeOutlined />}
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

            {/* Quick Stats */}
            <div className="stats-card">
              <h4>📊 Thống kê</h4>
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
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        title="📖 Xem trước truyện"
        open={previewModalOpen}
        onCancel={() => setPreviewModalOpen(false)}
        footer={null}
        width={1000}
        className="preview-modal"
      >
        {generatedStory && (
          <div className="preview-modal-content">
            <div className="preview-header">
              <img src={generatedStory.coverImage} alt={generatedStory.title} />
              <div className="preview-header-info">
                <h2>{generatedStory.title}</h2>
                <p>{generatedStory.heading}</p>
                <div className="preview-tags">
                  <Tag color="blue">Thể loại: {formData.theme}</Tag>
                  <Tag color="green">Độ tuổi: {formData.ageGroup}</Tag>
                  <Tag color="orange">{generatedStory.pages?.length} trang</Tag>
                </div>
              </div>
            </div>

            <div className="preview-pages">
              <h3>Nội dung truyện:</h3>
              <div className="pages-grid">
                {generatedStory.pages?.map((page, index) => (
                  <div key={index} className="page-preview">
                    <div className="page-number">Trang {page.pageNumber}</div>
                    <div className="page-image">
                      <img src={page.image} alt={`Page ${page.pageNumber}`} />
                    </div>
                    <div className="page-content">
                      <p>{page.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="preview-actions">
              <Row gutter={16} justify="center">
                <Col>
                  <Button
                    type="primary"
                    size="large"
                    icon={<SaveOutlined />}
                    loading={saving}
                    onClick={() => saveStory('published')}
                  >
                    Xuất bản ngay
                  </Button>
                </Col>
                <Col>
                  <Button
                    size="large"
                    icon={<SaveOutlined />}
                    loading={saving}
                    onClick={() => saveStory('draft')}
                  >
                    Lưu bản nháp
                  </Button>
                </Col>
                <Col>
                  <Button
                    size="large"
                    icon={<ReloadOutlined />}
                    onClick={retryGeneration}
                    loading={loading}
                  >
                    Tạo lại
                  </Button>
                </Col>
                <Col>
                  <Button
                    size="large"
                    onClick={() => setPreviewModalOpen(false)}
                  >
                    Đóng
                  </Button>
                </Col>
              </Row>
              <div className="action-note">
                <small>💡 Bạn có thể xuất bản ngay hoặc lưu bản nháp để chỉnh sửa sau</small>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Story Detail Modal */}
      <StoryModal
        open={open}
        onClose={() => setOpen(false)}
        story={generatedStory}
        loading={loading}
      />
    </>
  )
}

export default CreateComic