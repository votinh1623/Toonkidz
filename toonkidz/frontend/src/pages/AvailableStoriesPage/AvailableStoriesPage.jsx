// src/pages/AvailableStoriesPage/AvailableStoriesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Spin, message, Input, Pagination } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { getPublicStories } from '../../service/storyService';
import StoryDetailModal from '../../components/StoryDetailModal/StoryDetailModal';
import './AvailableStoriesPage.scss';
import { StarFilled } from "@ant-design/icons";

const themeFilters = [
  { value: null, label: "Tất cả" },
  { value: "fairytale", label: "Cổ tích" },
  { value: "adventure", label: "Phiêu lưu" },
  { value: "animal", label: "Động vật" },
  { value: "science", label: "Khoa học" },
  { value: "nature", label: "Thiên nhiên" },
  { value: "music", label: "Âm nhạc" },
];

const ageFilters = [
  { value: null, label: "Mọi lứa tuổi" },
  { value: "3-5", label: "3-5 tuổi" },
  { value: "6-8", label: "6-8 tuổi" },
  { value: "9-12", label: "9-12 tuổi" },
];

const AvailableStoriesPage = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 12, total: 0 });
  const [filters, setFilters] = useState({
    theme: null,
    ageGroup: null,
    search: ""
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
      };
      const res = await getPublicStories(params);
      if (res.success) {
        setStories(res.stories);
        setPagination(prev => ({
          ...prev,
          total: res.pagination.totalStories,
        }));
      } else {
        message.error(res.error || "Không thể tải danh sách truyện.");
      }
    } catch (error) {
      message.error("Đã xảy ra lỗi khi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (type, value) => {
    setPagination(p => ({ ...p, current: 1 }));
    setFilters(prev => ({ ...prev, [type]: value }));
  };

  const handlePageChange = (page, pageSize) => {
    setPagination(prev => ({ ...prev, current: page, pageSize: pageSize }));
  };

  const handleViewStory = (story) => {
    setSelectedStory(story);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => setIsModalOpen(false);

  return (
    <div className="available-stories-page">
      <div className="page-header">
        <h1>Truyện Sẵn Có</h1>
        <p>Khám phá kho tàng truyện tranh và truyện kể hấp dẫn do ToonKidz biên soạn.</p>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <span className="filter-label">Thể loại:</span>
          <div className="filter-options">
            {themeFilters.map(item => (
              <button
                key={item.label}
                className={`filter-btn ${filters.theme === item.value ? 'active' : ''}`}
                onClick={() => handleFilterChange('theme', item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <span className="filter-label">Độ tuổi:</span>
          <div className="filter-options">
            {ageFilters.map(item => (
              <button
                key={item.label}
                className={`filter-btn ${filters.ageGroup === item.value ? 'active' : ''}`}
                onClick={() => handleFilterChange('ageGroup', item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="page-loading"><Spin size="large" /></div>
      ) : (
        <>
          {stories.length > 0 ? (
            <div className="story-grid">
              {stories.map((story) => (
                <div className="story-card-item" key={story._id} onClick={() => handleViewStory(story)}>
                  <div className="card-img">
                    <img src={story.coverImage || '/placeholder.png'} alt={story.title} />
                    {story.ratingAvg > 0 && (
                      <div className="card-rating">
                        <StarFilled /> {story.ratingAvg.toFixed(1)}
                      </div>
                    )}
                  </div>
                  <div className="card-content">
                    <span className="card-theme">{story.theme}</span>
                    <h4 className="card-title">{story.title}</h4>
                    <p className="card-author">Tác giả: {story.userId?.name || 'ToonKidz'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="page-empty">
              <h3>Không tìm thấy truyện nào</h3>
              <p>Vui lòng thử thay đổi bộ lọc hoặc tìm kiếm lại.</p>
            </div>
          )}

          <Pagination
            className="story-pagination"
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onChange={handlePageChange}
            showSizeChanger={false}
          />
        </>
      )}

      <StoryDetailModal
        story={selectedStory}
        open={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default AvailableStoriesPage;