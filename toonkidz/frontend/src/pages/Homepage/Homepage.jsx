import React, { useState } from 'react'
import "./Homepage.scss";

const Homepage = () => {

  const [activeTab, setActiveTab] = useState("featured");

  const stories = [
    {
      id: 1,
      title: "Cuộc phiêu lưu của chú thỏ trong rừng kỳ diệu",
      author: "Cô Ngọc",
      description:
        "Chú thỏ con phải trải qua nhiều thử thách để tìm về nhà và học được những bài học quý giá về tình bạn và lòng dũng cảm.",
      category: "Cổ tích",
      status: "Hoàn thành",
      reads: "1.2M",
      likes: "85K",
      comments: "5.2K",
      rating: 4.9,
      image:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTCa5lGoOSNNor_DqVLVJM5TbLv0XSJvprQiw&s",
    },
    {
      id: 2,
      title: "Cô bé bán diêm và ngôi sao",
      author: "Ba Hoa",
      description:
        "Câu chuyện cảm động về cô bé bán diêm được một ngôi sao thần kỳ và cuộc hành trình thay đổi cuộc đời mình.",
      category: "Cổ tích",
      status: "Hoàn thành",
      reads: "1.2M",
      likes: "85K",
      comments: "5.2K",
      rating: 4.9,
      image:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFW_ZSXFX0kQnquxJGO-5F3ZHC-BB-MK7gFg&s",
    },
  ];

  return (
    <>
      <div className="home" >
        <div className="home__slider">
          <div className="home__slider__title">
            Thế giới truyện kì diệu dành cho bé
          </div>
          <div className="home__slider__subtitle">
            Hàng ngàn câu chuyện vui nhộn, giáo dục và đầy màu sắc đang chờ các bé khám phá
          </div>
          <div className="home__slider__button">
            <button className='home__slider__button--start'>Bắt đầu đọc</button>
            <button className='home__slider__button--more'>Tìm hiểu thêm</button>
          </div>
        </div>
        <div className="home_statistical">
          <div className="home__statistical__comic">
            <div className="home__statistical__comic__quantity">
              50K+
            </div>
            <div className="home__statistical__comic__title">
              Truyện
            </div>
          </div>
          <div className="home__statistical__author">
            <div className="home__statistical__comic__quantity">
              2K+
            </div>
            <div className="home__statistical__comic__title">
              Tác giả
            </div>
          </div>
          <div className="home__statistical__favourite">
            <div className="home__statistical__comic__quantity">
              500K+
            </div>
            <div className="home__statistical__comic__title">
              Bé yêu thích
            </div>
          </div>
          <div className="home__statistical__reader">
            <div className="home__statistical__comic__quantity">
              10M+
            </div>
            <div className="home__statistical__comic__title">
              Lượt đọc
            </div>
          </div>
        </div>
        <div className="home__tabs">
          <div className="tabs">
            <button
              className={activeTab === "featured" ? "active" : ""}
              onClick={() => setActiveTab("featured")}
            >
              ⭐ Nổi bật
            </button>
            <button
              className={activeTab === "trending" ? "active" : ""}
              onClick={() => setActiveTab("trending")}
            >
              🚀 Thịnh hành
            </button>
            <button
              className={activeTab === "latest" ? "active" : ""}
              onClick={() => setActiveTab("latest")}
            >
              🕒 Mới nhất
            </button>
          </div>
          <button className="share-btn">Chia sẻ truyện</button>
        </div>

        {/* Story List */}
        <div className="home__stories">
          {stories.map((story) => (
            <div key={story.id} className="story-card">
              <img src={story.image} alt={story.title} />
              <div className="story-content">
                <h3>{story.title}</h3>
                <p className="author">by {story.author}</p>
                <p className="desc">{story.description}</p>
                <div className="tags">
                  <span className="tag">{story.category}</span>
                  <span className="tag status">{story.status}</span>
                </div>
                <div className="meta">
                  <span>👀 {story.reads}</span>
                  <span>❤️ {story.likes}</span>
                  <span>💬 {story.comments}</span>
                </div>
                <div className="rating">⭐ {story.rating}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default Homepage