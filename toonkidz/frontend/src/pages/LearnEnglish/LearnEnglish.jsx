import React from 'react';
import { Input, Button } from 'antd';
import './LearnEnglish.scss';

const LearnEnglish = () => {
    return (
        <div className="english-learning-container">
            {/* Hero Section */}
            <div className="hero-section">
                <h1 className="main-title">Học Tiếng Anh Vui Nhộn</h1>
                <p className="subtitle">
                    Học tiếng Anh qua truyện tranh đầy thú vị! Cùng bé khám phá thế giới ngôn ngữ 🚀
                </p>

                <div className="grade-buttons">
                    <button className="grade-btn preschool">Mầm Non</button>
                    <button className="grade-btn grade1-2">Lớp 1-2</button>
                    <button className="grade-btn grade3-5">Lớp 3-5</button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="stats-overview">
                <div className="stat-card">
                    <div className="stat-icon score">🏆</div>
                    <div className="stat-content">
                        <div className="stat-label">Điểm Số</div>
                        <div className="stat-value">85</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon vocabulary">🎯</div>
                    <div className="stat-content">
                        <div className="stat-label">Từ Vựng Đã Học</div>
                        <div className="stat-value">12</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon stories">📚</div>
                    <div className="stat-content">
                        <div className="stat-label">Truyện Đã Đọc</div>
                        <div className="stat-value">8</div>
                    </div>
                </div>
            </div>

            {/* Content Tabs */}
            <div className="content-tabs">
                <div className="tab-background">
                    <button className="tab active">Truyện tiếng anh</button>
                    <button className="tab">Từ vựng</button>
                    <button className="tab">Luyện tập</button>
                </div>
            </div>

            {/* Story Card */}
            <div className="story-card">
                <div className="story-header">
                    <h3 className="story-title">Tên truyện: Rùa, Thỏ và Sóc</h3>
                </div>

                <div className="story-image-container">
                    <img
                        src="/images/stories/turtle-rabbit-squirrel.jpg"
                        alt="Rùa, Thỏ và Sóc"
                        className="story-image"
                    />
                </div>

                <div className="story-meta-section">
                    <div className="time-info">
                        <span className="time-icon">⏱️</span>
                        <span className="time-text">7 phút</span>
                    </div>
                </div>

                <div className="story-progress">
                    <div className="progress-info">
                        <span className="progress-label">Tiến độ</span>
                        <span className="progress-percent">60%</span>
                    </div>
                    <div className="progress-bar">
                        <div className="progress-track"></div>
                        <div className="progress-fill" style={{ width: '60%' }}></div>
                    </div>
                </div>

                {/* Vocabulary tags */}
                <div className="vocabulary-label">
                    <span className="vocab-icon">🔤</span>
                    <span className="vocab-text">Từ vựng trong truyện:</span>
                </div>

                <div className="vocabulary-tags">
                    <span className="vocab-tag">Rabbit</span>
                    <span className="vocab-tag">Turtle</span>
                    <span className="vocab-tag">Squirrel</span>
                </div>

                {/* Story Actions */}
                <div className="story-actions">
                    <button className="read-story-btn">
                        Đọc truyện ngay
                    </button>
                    <button className="volume-btn">
                        🔊
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LearnEnglish;
