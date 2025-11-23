import React, { useState, useEffect } from 'react';
import CountUp from 'react-countup';
import { Spin, message, Skeleton, Empty } from 'antd';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { getPublicStories, getSystemStats } from '../../service/storyService';
import StoryDetailModal from '../../components/StoryDetailModal/StoryDetailModal';
import StoryCard from '../../components/StoryCard/StoryCard';
import "./Homepage.scss";

const Homepage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("featured");
  const [stories, setStories] = useState([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const { currentUser } = useOutletContext();

  const [statsData, setStatsData] = useState({
    totalStories: 0,
    totalAuthors: 0,
    totalLikes: 0,
    totalReads: 0
  });

  const [selectedStory, setSelectedStory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getSystemStats();
        if (res.success) {
          setStatsData(res.stats);
        }
      } catch (error) {
        console.error("Failed to fetch stats");
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchStories = async () => {
      setLoadingStories(true);
      try {
        let params = { page: 1, limit: 8 };

        switch (activeTab) {
          case 'featured':
            params.sortBy = 'ratingAvg';
            break;
          case 'trending':
            params.sortBy = 'readCount';
            break;
          case 'latest':
            params.sortBy = 'createdAt';
            break;
        }

        const res = await getPublicStories(params);
        if (res.success) {
          setStories(res.stories);
        }
      } catch (error) {
        message.error("Không thể tải danh sách truyện.");
      } finally {
        setLoadingStories(false);
      }
    };

    fetchStories();
  }, [activeTab]);

  const statsDisplay = [
    { label: "Truyện", value: statsData.totalStories, suffix: "+", colorClass: "comic" },
    { label: "Tác giả", value: statsData.totalAuthors, suffix: "+", colorClass: "author" },
    { label: "Lượt thích", value: statsData.totalLikes, suffix: "+", colorClass: "favourite" },
    { label: "Lượt đọc", value: statsData.totalReads, suffix: "+", colorClass: "reader" },
  ];

  const handleViewStory = (story) => { setSelectedStory(story); setIsModalOpen(true); };
  const handleNavigateToCreate = () => { navigate('/home/create-comic'); };
  const handleNavigateToDiscover = () => { navigate('/discover'); };

  return (
    <div className="home">
      <div className="home__slider">
        <div className="home__slider__content">
          <div className="home__slider__title">Thế giới truyện kì diệu dành cho bé</div>
          <div className="home__slider__subtitle">
            Hàng ngàn câu chuyện vui nhộn, giáo dục và đầy màu sắc đang chờ các bé khám phá.
            Sáng tạo câu chuyện riêng của bạn ngay hôm nay!
          </div>
          <div className="home__slider__button">
            <button className="home__slider__button--start" onClick={handleNavigateToCreate}>
              Tạo truyện ngay
            </button>
            <button className="home__slider__button--more" onClick={handleNavigateToDiscover}>
              Khám phá thư viện
            </button>
          </div>
        </div>
      </div>

      <div className="home_statistical">
        {statsDisplay.map((item, index) => (
          <div key={index} className={`stat-card home__statistical__${item.colorClass}`}>
            <div className="home__statistical__comic__quantity">
              <CountUp
                start={0}
                end={item.value}
                duration={2.5}
                separator=","
              />
              {item.suffix}
            </div>
            <div className="home__statistical__comic__title">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="home__section-header">
        <div className="tabs">
          <button className={activeTab === "featured" ? "active" : ""} onClick={() => setActiveTab("featured")}>
            ⭐ Nổi bật
          </button>
          <button className={activeTab === "trending" ? "active" : ""} onClick={() => setActiveTab("trending")}>
            🚀 Thịnh hành
          </button>
          <button className={activeTab === "latest" ? "active" : ""} onClick={() => setActiveTab("latest")}>
            🕒 Mới nhất
          </button>
        </div>
        <button className="view-all-btn" onClick={handleNavigateToDiscover}>
          Xem tất cả &rarr;
        </button>
      </div>

      <div className="home__stories">
        {loadingStories ? (
          <div className="loading-grid">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton-card">
                <Skeleton.Image active className="sk-img" />
                <Skeleton active paragraph={{ rows: 2 }} />
              </div>
            ))}
          </div>
        ) : stories.length > 0 ? (
          <div className="story-grid-layout">
            {stories.map((story) => (
              <StoryCard
                key={story._id}
                story={story}
                onClick={handleViewStory}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Empty description="Chưa có truyện nào trong mục này" />
          </div>
        )}
      </div>

      <div className="home__cta">
        <h2>Bạn đã sẵn sàng sáng tạo?</h2>
        <p>Tham gia cùng hàng ngàn tác giả nhí và phụ huynh khác.</p>
        <button onClick={handleNavigateToCreate}>Bắt đầu ngay</button>
      </div>

      <StoryDetailModal
        story={selectedStory}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
};

export default Homepage;