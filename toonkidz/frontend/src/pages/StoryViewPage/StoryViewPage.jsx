// src/pages/StoryViewPage/StoryViewPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Spin, message } from 'antd';
import { getStoryById } from '../../service/storyService';
import StoryDetailModal from '../../components/StoryDetailModal/StoryDetailModal';
import './StoryViewPage.scss';

const StoryViewPage = () => {
  const { storyId } = useParams();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const res = await getStoryById(storyId);
        if (res.success) {
          setStory(res.story);
        } else {
          message.error('Không tìm thấy truyện này!');
        }
      } catch (error) {
        message.error('Lỗi khi tải truyện!');
      } finally {
        setLoading(false);
      }
    };
    fetchStory();
  }, [storyId]);

  if (loading) {
    return <div className="story-view-loading"><Spin size="large" /></div>;
  }

  if (!story) {
    return <div className="story-view-loading"><h1>Không tìm thấy truyện</h1></div>;
  }

  return (
    <div
      className="story-view-page-container"
      style={{ backgroundImage: `url(${story.coverImage})` }}
    >
      <StoryDetailModal story={story} open={true} onClose={() => { }} />
    </div>
  );
};

export default StoryViewPage;