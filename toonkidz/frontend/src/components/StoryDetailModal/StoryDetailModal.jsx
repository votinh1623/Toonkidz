import React, { useRef, useEffect, useState } from "react";
import { Modal, Carousel, Button, Tooltip, message, Spin } from "antd";
import { RedoOutlined, CloseOutlined, HeartOutlined, HeartFilled, LockOutlined, UnlockOutlined } from "@ant-design/icons";
import { Volume2, PauseCircle } from "lucide-react";
import "./StoryDetailModal.scss";
import { incrementStoryReadCount, rateStory, getStoryById } from "../../service/storyService";
import { toggleFavorite } from "../../service/userService";
import StarRating from "./StarRating";
import { toast } from "sonner";

const StoryDetailModal = ({ story: initialStory, open, onClose, currentUser }) => {

  const carouselRef = useRef(null);
  const audioRefs = useRef([]);

  const [currentStory, setCurrentStory] = useState(initialStory);
  const [loading, setLoading] = useState(false);

  const [hasCountedRead, setHasCountedRead] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);

  const [isLocked, setIsLocked] = useState(false);
  const [unlockProgress, setUnlockProgress] = useState(0);

  const [playingIndex, setPlayingIndex] = useState(null);

  const animationFrame = useRef(null);
  const startTimeRef = useRef(null);
  const btnRef = useRef(null);

  const stopAllAudio = () => {
    audioRefs.current.forEach(audio => {
      if (audio && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    setPlayingIndex(null);
  };

  useEffect(() => {
    let isMounted = true;

    const initStory = async () => {
      if (open && initialStory) {
        setLoading(true);
        setIsLocked(false);
        setUnlockProgress(0);
        setPlayingIndex(null);

        try {
          const storyId = initialStory._id || initialStory.id;
          const res = await getStoryById(storyId);

          if (isMounted && res.success) {
            const freshStory = res.story;
            setCurrentStory(freshStory);

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
              setIsFavorite(isLiked);
            } else {
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
      cancelAnimationFrame(animationFrame.current);
    };
  }, [open, initialStory, currentUser]);

  const startUnlock = () => {
    if (!isLocked) {
      setIsLocked(true);
      toast.success("Đã khóa! Nhẫn giữ để mở khoá!.", {
        icon: '🔓',
        style: {
          borderRadius: '20px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: '#fff',
          backdropFilter: 'blur(10px)',
        }
      });
      return;
    }

    startTimeRef.current = Date.now();
    const duration = 1500;

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min((elapsed / duration) * 100, 100);

      if (btnRef.current) {
        btnRef.current.style.setProperty("--progress", progress);
      }

      if (progress < 100) {
        animationFrame.current = requestAnimationFrame(animate);
      } else {
        setIsLocked(false);
        if (btnRef.current) {
          btnRef.current.style.setProperty("--progress", 0);
        }

        message.success("Đã mở khóa!");
      }
    };

    animationFrame.current = requestAnimationFrame(animate);
  };


  const cancelUnlock = () => {
    cancelAnimationFrame(animationFrame.current);
    if (btnRef.current) {
      btnRef.current.style.setProperty("--progress", 0);
    }
  };


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
        setUserRating(0);
      }
    } catch (error) {
      message.error("Lỗi kết nối.");
      setUserRating(0);
    }
  };

  const toggleAudio = (index) => {
    const audio = audioRefs.current[index];
    if (!audio) return;

    if (audio.paused) {
      audioRefs.current.forEach((a, i) => {
        if (i !== index && a) {
          a.pause();
          a.currentTime = 0;
        }
      });

      audio.play().catch(e => console.error("Play error:", e));
      setPlayingIndex(index);
    } else {
      audio.pause();
      setPlayingIndex(null);
    }
  };

  const handleSlideChange = async (currentSlideIndex) => {
    stopAllAudio();

    const audio = audioRefs.current[currentSlideIndex];
    if (audio) {
      setTimeout(() => {
        audio.play()
          .then(() => setPlayingIndex(currentSlideIndex))
          .catch(() => { });
      }, 300);
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
  const handleAudioEnded = () => {
    setPlayingIndex(null);
    carouselRef.current.next();
  };
  const handleReRead = () => carouselRef.current.goTo(0);

  const handleClose = () => {
    if (!isLocked) {
      stopAllAudio();
      onClose();
    }
  };

  if (loading) {
    return (
      <Modal open={open} footer={null} centered width={900} className="story-modal">
        <div style={{ height: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin size="large" />
        </div>
      </Modal>
    )
  }

  if (!currentStory) return null;

  const coverSlide = { isCover: true, title: currentStory.title, head: currentStory.head, coverImage: currentStory.coverImage };
  const endSlide = { isEnd: true, title: currentStory.title, coverImage: currentStory.coverImage };
  const allSlides = [coverSlide, ...(currentStory.pages || []), endSlide];
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (unlockProgress / 100) * circumference;

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      width={900}
      className={`story-modal ${isLocked ? 'child-locked' : ''}`}
      centered
      destroyOnClose

      maskClosable={!isLocked}
      keyboard={!isLocked}
    >

      <div
        ref={btnRef}
        className={`child-lock-btn ${isLocked ? 'locked' : ''}`}
        onMouseDown={startUnlock}
        onMouseUp={cancelUnlock}
        onMouseLeave={cancelUnlock}
        onTouchStart={startUnlock}
        onTouchEnd={cancelUnlock}
      >
        <svg className="progress-ring" width="50" height="50">
          <circle
            className="progress-ring__circle"
            stroke="white"
            strokeWidth="3"
            fill="transparent"
            r={radius}
            cx="25"
            cy="25"
            style={{
              strokeDasharray: `${circumference} ${circumference}`,
              strokeDashoffset: strokeDashoffset
            }}
          />
        </svg>

        <div className="icon-container">
          {isLocked ? <LockOutlined /> : <UnlockOutlined />}
        </div>
      </div>

      {!isLocked && (
        <button className="custom-close-btn" onClick={handleClose}>
          <CloseOutlined />
        </button>
      )}

      <Carousel
        ref={carouselRef}
        dots={!isLocked}
        arrows={true}
        infinite={false}
        afterChange={handleSlideChange}
        speed={800}
        draggable={!isLocked}
      >
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

                  <div className={`interaction-section ${isLocked ? 'disabled-content' : ''}`}>
                    <div className="rating-box">
                      <span>Bạn thấy truyện thế nào?</span>
                      <div className={isLocked ? 'pointer-events-none' : ''}>
                        <StarRating
                          value={userRating}
                          onChange={handleRate}
                        />
                      </div>
                      {hasRated && <span className="thank-you">Cảm ơn bé! ❤️</span>}
                    </div>
                    <div className="favorite-box">
                      <Tooltip title={isFavorite ? "Bỏ yêu thích" : "Yêu thích truyện này"}>
                        <Button
                          shape="circle" size="large"
                          className={`fav-btn ${isFavorite ? 'active' : ''}`}
                          icon={isFavorite ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                          onClick={handleToggleFavorite}
                          disabled={isLocked}
                        />
                      </Tooltip>
                      <span>{isFavorite ? "Đã yêu thích" : "Thêm vào yêu thích"}</span>
                    </div>
                  </div>

                  <div className="end-actions">
                    <Button className="end-btn reread" size="large" icon={<RedoOutlined />} onClick={handleReRead}>
                      Đọc lại
                    </Button>
                    {!isLocked && (
                      <Button className="end-btn close" size="large" icon={<CloseOutlined />} onClick={handleClose}>
                        Đóng
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          }
          const isPlaying = playingIndex === index;
          return (
            <div key={slide._id || index} className="story-page-slide">
              <div className="story-page-wrapper">
                <div className="page-image-container">
                  {slide.image ? (
                    <img src={slide.image} alt={`Trang ${slide.pageNumber}`} />
                  ) : (
                    <div className="no-image-placeholder">Không có hình ảnh</div>
                  )}
                </div>
                <div className="page-content-container">
                  <div className="page-content"><p>{slide.content}</p></div>

                  {slide.audio && (
                    <div className="custom-audio-wrapper">
                      <button
                        className={`custom-audio-btn ${isPlaying ? 'playing' : ''}`}
                        onClick={() => toggleAudio(index)}
                      >
                        {isPlaying ? <PauseCircle size={20} /> : <Volume2 size={20} />}
                        <span>{isPlaying ? 'Đang đọc...' : 'Nghe đọc'}</span>

                        {isPlaying && (
                          <div className="sound-wave">
                            <span></span><span></span><span></span>
                          </div>
                        )}
                      </button>
                      <audio
                        src={slide.audio}
                        ref={el => (audioRefs.current[index] = el)}
                        onEnded={() => handleAudioEnded(index)}
                        className="hidden-audio"
                      />
                    </div>
                  )}
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