// components/StoryModal/StoryModal.jsx
import React from 'react';
import { Modal, Carousel, Spin } from 'antd';
import './StoryModal.scss';

const StoryModal = ({ open, onClose, story, loading }) => {
  return (
    <Modal
      title={story?.title || "Câu chuyện"}
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      className="story-modal"
    >
      {loading ? (
        <div className="loading-container">
          <Spin size="large" />
          <p>Đang tạo truyện... Vui lòng chờ trong giây lát</p>
        </div>
      ) : story ? (
        <div className="story-content">
          <div className="story-header">
            <img src={story.coverImage} alt={story.title} className="cover-image" />
            <div className="story-info">
              <h2>{story.title}</h2>
              <p className="heading">{story.heading}</p>
              <div className="meta-info">
                <span>Độ tuổi: {story.ageGroup}</span>
                <span>•</span>
                <span>{story.readingTime} phút đọc</span>
              </div>
            </div>
          </div>

          <Carousel className="story-carousel">
            {story.pages?.map((page, index) => (
              <div key={page.pageNumber || index} className="story-page">
                <div className="page-image">
                  <img src={page.image} alt={`Page ${page.pageNumber}`} />
                </div>
                <div className="page-content">
                  <p>{page.content}</p>
                </div>
                {page.audio && (
                  <audio controls className="page-audio">
                    <source src={page.audio} type="audio/mpeg" />
                  </audio>
                )}
              </div>
            ))}
          </Carousel>

          <div className="story-actions">
            <button className="btn-primary">Lưu truyện</button>
            <button className="btn-secondary">Chia sẻ</button>
            <button className="btn-outline" onClick={onClose}>Đóng</button>
          </div>
        </div>
      ) : (
        <div className="no-story">
          <p>Chưa có truyện nào được tạo</p>
        </div>
      )}
    </Modal>
  );
};

export default StoryModal;