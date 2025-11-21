import React, { useRef, useEffect, useState } from "react";
import { Modal, Carousel, Button, Rate, Tooltip, message, Spin } from "antd";
import { RedoOutlined, CloseOutlined, HeartOutlined, HeartFilled } from "@ant-design/icons";
import "./StoryDetailModal.scss";
import { incrementStoryReadCount, rateStory, getStoryById } from "../../service/storyService";
import { toggleFavorite } from "../../service/userService";

const StoryDetailModal = ({ story: initialStory, open, onClose, currentUser }) => {

  const carouselRef = useRef(null);
  const audioRefs = useRef([]);

  const [currentStory, setCurrentStory] = useState(initialStory);
  const [loading, setLoading] = useState(false);

  const [hasCountedRead, setHasCountedRead] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);

  const stopAllAudio = () => {
    audioRefs.current.forEach(audio => {
      if (audio && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  };

  useEffect(() => {
    let isMounted = true;

    const initStory = async () => {
      if (open && initialStory) {
        setLoading(true);
        try {
          const storyId = initialStory._id || initialStory.id;
          const res = await getStoryById(storyId);

          if (isMounted && res.success) {
            const freshStory = res.story;
            setCurrentStory(freshStory);

            console.log("=== DEBUG STORY DETAIL ===");
            console.log("1. Current User ID:", currentUser?._id);
            console.log("2. Story Favorites Array:", freshStory.favorites);

            if (carouselRef.current) {
              carouselRef.current.goTo(0, true);
            }
            setHasCountedRead(false);

            if (freshStory.myRating && freshStory.myRating > 0) {
              setUserRating(freshStory.myRating);
              setHasRated(true);
            } else {
              setUserRating(0);
              setHasRated(false);
            }

            if (currentUser && Array.isArray(freshStory.favorites)) {
              const isLiked = freshStory.favorites.some(item => {
                const itemId = (item && item._id) ? item._id : item;

                return String(itemId) === String(currentUser._id);
              });

              console.log("3. Kết quả isLiked:", isLiked);
              setIsFavorite(isLiked);
            } else {
              console.log("3. Không check được Favorite (thiếu user hoặc favorites null)");
              setIsFavorite(false);
            }
          }
        } catch (error) {
          console.error("Failed to fetch details", error);
          setCurrentStory(initialStory);
        } finally {
          if (isMounted) setLoading(false);
        }
      }
    };

    initStory();

    return () => {
      isMounted = false;
      stopAllAudio();
    };
  }, [open, initialStory, currentUser]);

  if (!currentStory && !loading) return null;

  const handleToggleFavorite = async () => {
    const storyId = currentStory._id || currentStory.id;
    try {
      const res = await toggleFavorite(storyId);
      if (res.success) {
        setIsFavorite(!isFavorite);
        message.success(!isFavorite ? "Đã thêm vào yêu thích!" : "Đã bỏ yêu thích");
      }
    } catch (error) {
      message.error("Lỗi kết nối!");
    }
  };

  const handleRate = async (value) => {
    if (value === userRating) return;
    setUserRating(value);

    const storyId = currentStory._id || currentStory.id;
    try {
      const res = await rateStory(storyId, value);
      if (res.success) {
        setHasRated(true);
        message.success("Cập nhật đánh giá thành công!");
      } else {
        message.error("Đánh giá thất bại.");
      }
    } catch (error) {
      message.error("Lỗi kết nối.");
    }
  };

  const handleSlideChange = async (currentSlideIndex) => {
    stopAllAudio();
    const audio = audioRefs.current[currentSlideIndex];
    if (audio) {
      audio.play().catch(() => { });
    }

    const contentPageCount = currentStory?.pages?.length || 0;
    if (contentPageCount > 0 && currentSlideIndex >= contentPageCount && !hasCountedRead) {
      try {
        const storyId = currentStory._id || currentStory.id;
        await incrementStoryReadCount(storyId);
        setHasCountedRead(true);
      } catch (error) {
        console.error("Lỗi tăng lượt đọc:", error);
      }
    }
  };

  const handleStartReading = () => carouselRef.current.goTo(1);
  const handleAudioEnded = () => carouselRef.current.next();
  const handleReRead = () => carouselRef.current.goTo(0);
  const handleClose = () => { stopAllAudio(); onClose(); };

  if (loading) {
    return (
      <Modal open={open} onCancel={handleClose} footer={null} centered width={900} className="story-modal">
        <div style={{ height: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin size="large" />
        </div>
      </Modal>
    )
  }

  const coverSlide = { isCover: true, title: currentStory.title, head: currentStory.head, coverImage: currentStory.coverImage };
  const endSlide = { isEnd: true, title: currentStory.title, coverImage: currentStory.coverImage };
  const allSlides = [coverSlide, ...(currentStory.pages || []), endSlide];

  return (
    <Modal open={open} onCancel={handleClose} footer={null} width={900} className="story-modal" centered destroyOnClose>
      <Carousel ref={carouselRef} dots={{ className: "custom-dots" }} arrows={true} infinite={false} afterChange={handleSlideChange} speed={800} draggable={false}>
        {allSlides.map((slide, index) => {
          if (slide.isCover) {
            return (
              <div key="cover" className="story-cover-slide">
                <div className="cover-background" style={{ backgroundImage: `url(${slide.coverImage})` }} />
                <div className="cover-content">
                  <h1>{slide.title}</h1>
                  <p>{slide.head}</p>
                  <Button type="primary" size="large" className="start-reading-btn" onClick={handleStartReading}>
                    Bắt đầu đọc
                  </Button>
                </div>
              </div>
            );
          }
          if (slide.isEnd) {
            return (
              <div key="end" className="story-end-slide">
                <div className="cover-background" style={{ backgroundImage: `url(${slide.coverImage})` }} />
                <div className="end-content">
                  <h2>🎉 Chúc mừng! 🎉</h2>
                  <p>Bạn đã hoàn thành câu chuyện<br /><strong>"{slide.title}"</strong></p>
                  <div className="interaction-section">
                    <div className="rating-box">
                      <span>Bạn thấy truyện thế nào?</span>
                      <Rate allowHalf value={userRating} onChange={handleRate} className="custom-rate" />
                      {hasRated && <span className="thank-you">Cảm ơn bé! ❤️</span>}
                    </div>
                    <div className="favorite-box">
                      <Tooltip title={isFavorite ? "Bỏ yêu thích" : "Yêu thích truyện này"}>
                        <Button
                          shape="circle" size="large"
                          className={`fav-btn ${isFavorite ? 'active' : ''}`}
                          icon={isFavorite ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                          onClick={handleToggleFavorite}
                        />
                      </Tooltip>
                      <span>{isFavorite ? "Đã yêu thích" : "Thêm vào yêu thích"}</span>
                    </div>
                  </div>
                  <div className="end-actions">
                    <Button className="end-btn reread" size="large" icon={<RedoOutlined />} onClick={handleReRead}>Đọc lại</Button>
                    <Button className="end-btn close" size="large" icon={<CloseOutlined />} onClick={handleClose}>Đóng</Button>
                  </div>
                </div>
              </div>
            );
          }
          return (
            <div key={slide._id || index} className="story-page-slide">
              <div className="story-page-wrapper">
                <div className="page-image-container">
                  {slide.image ? <img src={slide.image} alt={`Trang ${slide.pageNumber}`} /> : <div className="no-image-placeholder">Không có hình ảnh</div>}
                </div>
                <div className="page-content-container">
                  <div className="page-content"><p>{slide.content}</p></div>
                  {slide.audio && <div className="audio-player"><audio controls src={slide.audio} ref={el => (audioRefs.current[index] = el)} onEnded={() => handleAudioEnded(index)} /></div>}
                </div>
              </div>
            </div>
          );
        })}
      </Carousel>
    </Modal>
  );
};

export default StoryDetailModal;