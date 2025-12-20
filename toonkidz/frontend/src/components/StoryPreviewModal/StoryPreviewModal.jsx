import React, { useRef, useEffect, useState } from "react";
import { Volume2, PauseCircle, PlayCircle, X } from "lucide-react";
import "./StoryPreviewModal.scss";

const StoryPreviewModal = ({ story, open, onClose, onSave }) => {
  const audioRefs = useRef([]);
  const [currentStory, setCurrentStory] = useState(story);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const coverSlide = {
    isCover: true,
    title: currentStory?.title,
    heading: currentStory?.heading,
    coverImage: currentStory?.coverImage
  };
  const endSlide = {
    isEnd: true,
    title: currentStory?.title,
    coverImage: currentStory?.coverImage
  };

  const allSlides = [coverSlide, ...(currentStory?.pages || []), endSlide];
  const slide = allSlides[currentSlide];

  useEffect(() => {
    if (open && story) {
      setCurrentStory(story);
      setCurrentSlide(0);
      setIsAudioPlaying(false);
    }
  }, [open, story]);

  const stopAllAudio = () => {
    audioRefs.current.forEach(audio => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    setIsAudioPlaying(false);
  };

  const handleSlideChange = (newSlide) => {
    stopAllAudio();
    setCurrentSlide(newSlide);
  };

  useEffect(() => {
    if (!open) return;

    const audio = audioRefs.current[currentSlide];
    const currentSlideData = allSlides[currentSlide];
    const shouldAutoPlay = !currentSlideData?.isCover && !currentSlideData?.isEnd && currentSlideData?.audio;

    if (shouldAutoPlay && audio) {
      stopAllAudio();

      const timer = setTimeout(() => {
        audio.play()
          .then(() => setIsAudioPlaying(true))
          .catch(e => console.log("Auto-play prevented:", e));
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setIsAudioPlaying(false);
    }
  }, [currentSlide, open]);

  const toggleAudio = () => {
    const audio = audioRefs.current[currentSlide];
    if (!audio) return;

    if (audio.paused) {
      audioRefs.current.forEach((a, index) => {
        if (index !== currentSlide && a) {
          a.pause();
          a.currentTime = 0;
        }
      });

      audio.play().catch(e => console.error("Audio play error:", e));
      setIsAudioPlaying(true);
    } else {
      audio.pause();
      setIsAudioPlaying(false);
    }
  };

  const handleStartReading = () => handleSlideChange(1);

  const handleAudioEnded = () => {
    setIsAudioPlaying(false);
    if (currentSlide < allSlides.length - 1) {
      setTimeout(() => {
        handleSlideChange(currentSlide + 1);
      }, 500);
    }
  };

  const handleReRead = () => handleSlideChange(0);

  const handlePrev = () => {
    if (currentSlide > 0) handleSlideChange(currentSlide - 1);
  };

  const handleNext = () => {
    if (currentSlide < allSlides.length - 1) handleSlideChange(currentSlide + 1);
  };

  const handleClose = () => {
    stopAllAudio();
    onClose();
  };

  if (!open || !currentStory) return null;

  return (
    <div className={`story-preview-overlay ${open ? 'active' : ''}`} onClick={handleClose}>
      <div className="story-preview-container" onClick={(e) => e.stopPropagation()}>

        <button className="preview-close-btn" onClick={handleClose}>
          <X size={24} />
        </button>

        <div className="custom-carousel">
          <div className="carousel-content">
            {slide?.isCover ? (
              <div className="preview-slide cover-slide">
                <div className="slide-background" style={{ backgroundImage: `url(${slide.coverImage})` }} />
                <div className="slide-overlay" />
                <div className="cover-content">
                  <div className="cover-wrapper">
                    <div className="cover-image-box">
                      <img
                        src={slide.coverImage || '/default-cover.jpg'}
                        alt={slide.title}
                        onError={(e) => { e.target.src = '/default-cover.jpg'; }}
                      />
                    </div>
                    <div className="cover-info">
                      <h1>{slide.title}</h1>
                      <p className="cover-heading">{slide.heading}</p>
                      <button className="start-reading-btn" onClick={handleStartReading}>
                        Bắt đầu đọc ➔
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : slide?.isEnd ? (
              <div className="preview-slide end-slide">
                <div className="slide-background" style={{ backgroundImage: `url(${slide.coverImage})` }} />
                <div className="slide-overlay" />
                <div className="end-content">
                  <div className="end-celebration">
                    <div className="celebration-icon">🏆</div>
                    <h2>Chúc mừng!</h2>
                    <p>Bạn đã hoàn thành câu chuyện<br /><strong>"{slide.title}"</strong></p>
                  </div>
                  <div className="end-actions">
                    <button onClick={handleReRead} className="action-btn reread-btn">↻ Đọc lại</button>
                    <div className="save-group">
                      <button
                        onClick={() => { handleClose(); onSave && onSave('draft'); }}
                        className="action-btn draft-btn"
                      >
                        Lưu nháp
                      </button>
                      <button
                        onClick={() => { handleClose(); onSave && onSave('published'); }}
                        className="action-btn publish-btn"
                      >
                        Xuất bản ngay
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="preview-slide content-slide">
                <div className="slide-wrapper">
                  <div className="page-header">
                    <span className="page-number">Trang {slide?.pageNumber || currentSlide}</span>
                  </div>

                  <div className="page-layout">
                    <div className="page-image">
                      {slide?.image ? (
                        <img
                          src={slide.image}
                          alt={`Trang ${slide?.pageNumber}`}
                          onError={(e) => { e.target.src = '/default-page.jpg'; }}
                        />
                      ) : (
                        <div className="no-image-placeholder">Chưa có hình ảnh</div>
                      )}
                    </div>

                    <div className="page-text-container">
                      <p className="page-text">{slide?.content}</p>

                      {slide?.audio && (
                        <div className="custom-audio-wrapper">
                          <button
                            className={`custom-audio-btn ${isAudioPlaying ? 'playing' : ''}`}
                            onClick={toggleAudio}
                          >
                            {isAudioPlaying ? <PauseCircle size={20} /> : <Volume2 size={20} />}
                            <span>{isAudioPlaying ? 'Đang đọc...' : 'Nghe đọc'}</span>

                            {isAudioPlaying && (
                              <div className="sound-wave">
                                <span></span><span></span><span></span>
                              </div>
                            )}
                          </button>

                          <audio
                            src={slide.audio}
                            ref={el => (audioRefs.current[currentSlide] = el)}
                            onEnded={handleAudioEnded}
                            className="hidden-audio"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            className="carousel-arrow carousel-arrow-prev"
            onClick={handlePrev}
            disabled={currentSlide === 0}
          >
            ‹
          </button>
          <button
            className="carousel-arrow carousel-arrow-next"
            onClick={handleNext}
            disabled={currentSlide === allSlides.length - 1}
          >
            ›
          </button>
        </div>

        <div className="preview-info-bar">
          <div className="info-left">
            <span className="info-item">📖 {currentStory?.pages?.length || 0} trang</span>
            <span className="info-divider">•</span>
            <span className="info-item">⏱️ ~{Math.ceil((currentStory?.pages?.length || 0) * 0.5)} phút đọc</span>
          </div>

          <div className="carousel-dots-mini">
            {allSlides.map((_, index) => (
              <button
                key={index}
                className={`mini-dot ${currentSlide === index ? 'active' : ''}`}
                onClick={() => handleSlideChange(index)}
              />
            ))}
          </div>

          <div className="info-right">
            <span className="preview-label">Bản xem trước</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryPreviewModal;