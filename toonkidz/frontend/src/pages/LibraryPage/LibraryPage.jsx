// src/pages/LibraryPage/LibraryPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Spin, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart as faHeartSolid, faShareSquare } from '@fortawesome/free-solid-svg-icons';
import { getMyStories, deleteStoryById } from '../../service/storyService';
import { getFavorites, toggleFavorite } from '../../service/userService';
import StoryDetailModal from '../../components/StoryDetailModal/StoryDetailModal';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import 'sweetalert2/src/sweetalert2.scss';
import './LibraryPage.scss';

const LibraryPage = () => {
  const [activeTab, setActiveTab] = useState('my-stories');
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (activeTab === 'my-stories') {
        res = await getMyStories();
      } else {
        res = await getFavorites();
      }
      if (res.success) {
        setStories(res.stories);
      } else {
        message.error(res.error || "Không thể tải dữ liệu.");
      }
    } catch (error) {
      message.error("Đã xảy ra lỗi khi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const fetchInitialFavorites = async () => {
      const res = await getFavorites();
      if (res.success) {
        setFavoriteIds(res.stories.map(s => s._id));
      }
    }
    fetchInitialFavorites();
  }, []);

  const handleToggleFavorite = async (storyId) => {
    const isCurrentlyFavorite = favoriteIds.includes(storyId);
    setFavoriteIds(prev => isCurrentlyFavorite ? prev.filter(id => id !== storyId) : [...prev, storyId]);

    try {
      await toggleFavorite(storyId);
      if (activeTab === 'favorites' && isCurrentlyFavorite) {
        fetchData();
      }
    } catch (error) {
      message.error("Thao tác thất bại, vui lòng thử lại.");
      setFavoriteIds(prev => isCurrentlyFavorite ? [...prev, storyId] : prev.filter(id => id !== storyId));
    }
  };

  const handleShare = () => {
    message.info("Chức năng chia sẻ sẽ sớm được cập nhật!");
  };

  const handleViewStory = (story) => {
    setSelectedStory(story);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => setIsModalOpen(false);

  const handleDelete = (storyId, title) => {
    Swal.fire({
      title: `Bạn có chắc chắn muốn xóa?`,
      html: `Bạn sẽ không thể hoàn tác hành động này đối với truyện:<br><strong>${title}</strong>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Vâng, xóa nó!",
      cancelButtonText: "Hủy"
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Đang xóa...',
          html: `Vui lòng chờ trong khi truyện <strong>${title}</strong> được xóa.`,
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        try {
          const res = await deleteStoryById(storyId);
          if (res.success) {
            Swal.fire({
              title: "Đã xóa!",
              text: `Truyện "${title}" đã được xóa thành công.`,
              icon: "success",
              timer: 1500,
              showConfirmButton: false,
            });
            fetchData();
          } else {
            Swal.fire("Lỗi!", res.error || "Xóa truyện thất bại.", "error");
          }
        } catch (error) {
          Swal.fire("Lỗi!", "Đã xảy ra lỗi khi kết nối đến server.", "error");
        }
      }
    });
  };

  const renderContent = () => {
    if (loading) {
      return <div className="library-loading"><Spin size="large" /></div>;
    }

    if (stories.length === 0) {
      return (
        <div className="library__empty">
          <h3>{activeTab === 'my-stories' ? 'Bạn chưa tạo câu chuyện nào.' : 'Bạn chưa có truyện yêu thích nào.'}</h3>
          <p>{activeTab === 'my-stories' ? 'Hãy bắt đầu sáng tạo ngay thôi!' : 'Hãy khám phá và thêm truyện vào danh sách nhé!'}</p>
        </div>
      );
    }

    return (
      <div className="library__comics">
        {stories.map((story) => (
          <div className="library__comics__item" key={story._id}>
            <div className="library__comics__item__img">
              <img src={story.coverImage || '/placeholder.png'} alt={story.title} />
            </div>
            <div
              className={`library__comics__item__fav ${favoriteIds.includes(story._id) ? "active" : ""}`}
              onClick={() => handleToggleFavorite(story._id)}
            >
              <FontAwesomeIcon icon={faHeartSolid} />
            </div>
            <div className="library__comics__item__title">{story.title}</div>
            <div className="library__comics__item__type">{story.theme}</div>
            <div className="library__comics__item__description">
              {story.head}
            </div>
            <button className="library__comics__item__read" onClick={() => handleViewStory(story)}>Đọc truyện</button>
            {activeTab === 'my-stories' && (
              <div className="library__comics__item__button">
                <button
                  className="library__comics__item__button__edit"
                  onClick={() => navigate(`/home/edit-story/${story._id}`, { state: { from: '/home/library' } })}
                >
                  Chỉnh sửa
                </button>
                <button className="library__comics__item__button__delete" onClick={() => handleDelete(story._id, story.title)}>Xóa</button>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="library">
      <div className="library__title">Thư Viện</div>

      <div className="library__tabs">
        <div
          className={`library__tabs__yourcomic ${activeTab === 'my-stories' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-stories')}
        >
          Truyện của bạn
        </div>
        <div
          className={`library__tabs__favourite ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          Yêu thích
        </div>
        <button className="library__tabs__share-btn" onClick={handleShare}>
          <FontAwesomeIcon icon={faShareSquare} />
          <span>Chia sẻ truyện</span>
        </button>
      </div>

      {renderContent()}

      <StoryDetailModal
        story={selectedStory}
        open={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default LibraryPage;