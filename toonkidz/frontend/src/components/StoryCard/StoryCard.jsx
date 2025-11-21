import React from 'react';
import { StarFilled, EyeOutlined, HeartOutlined, MessageOutlined } from "@ant-design/icons";
import './StoryCard.scss';

const StoryCard = ({ story, onClick }) => {
  return (
    <div className="story-card-item" onClick={() => onClick(story)}>
      <div className="card-img">
        <img
          src={story.coverImage || 'https://www.svgrepo.com/show/508699/landscape-placeholder.svg'}
          alt={story.title}
          onError={(e) => { e.target.onerror = null; e.target.src = 'https://www.svgrepo.com/show/508699/landscape-placeholder.svg' }}
        />
        {story.ratingAvg > 0 && (
          <div className="card-rating">
            <StarFilled /> {story.ratingAvg.toFixed(1)}
          </div>
        )}
        <div className="card-overlay">
          <button className="read-now-btn">Đọc ngay</button>
        </div>
      </div>
      <div className="card-content">
        <div className="card-tags">
          <span className={`card-theme theme-${story.theme}`}>{story.theme}</span>
        </div>
        <h4 className="card-title" title={story.title}>{story.title}</h4>
        <p className="card-author">Tác giả: <span>{story.userId?.name || 'ToonKidz'}</span></p>

        <div className="card-stats">
          <span title="Lượt đọc"><EyeOutlined /> {story.readCount || 0}</span>
          <span title="Lượt yêu thích"><HeartOutlined /> {story.favorites?.length || 0}</span>
        </div>
      </div>
    </div>
  );
};

export default StoryCard;