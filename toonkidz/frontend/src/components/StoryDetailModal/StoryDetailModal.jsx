// src/components/StoryDetailModal/StoryDetailModal.jsx

import React, { useRef, useEffect } from "react";
import { Modal, Carousel, Button } from "antd";
import { RedoOutlined, CloseOutlined } from "@ant-design/icons";
import "./StoryDetailModal.scss";

const StoryDetailModal = ({ story, open, onClose }) => {
  const carouselRef = useRef(null);
  const audioRefs = useRef([]);

  const stopAllAudio = () => {
    audioRefs.current.forEach(audio => {
      if (audio && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  };

  useEffect(() => {
    if (open && carouselRef.current) {
      carouselRef.current.goTo(0, true);
    }
    return () => {
      stopAllAudio();
    };
  }, [open]);

  if (!story) {
    return null;
  }

  const handleSlideChange = (currentSlideIndex) => {
    stopAllAudio();
    const audio = audioRefs.current[currentSlideIndex];
    if (audio) {
      audio.play().catch(error => {
        console.warn("Audio autoplay was prevented by the browser.", error);
      });
    }
  };

  const handleStartReading = () => {
    carouselRef.current.goTo(1);
  };

  const handleAudioEnded = () => {
    carouselRef.current.next();
  };

  const handleClose = () => {
    stopAllAudio();
    onClose();
  };

  const coverSlide = {
    isCover: true,
    title: story.title,
    head: story.head,
    coverImage: story.coverImage,
  };

  const endSlide = {
    isEnd: true,
    title: story.title,
    coverImage: story.coverImage,
  };

  const allSlides = [coverSlide, ...story.pages, endSlide];

  const handleReRead = () => {
    carouselRef.current.goTo(0);
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      width={900}
      className="story-modal"
      centered
      destroyOnClose
    >
      <Carousel
        ref={carouselRef}
        dots={{ className: "custom-dots" }}
        arrows={true}
        infinite={false}
        afterChange={handleSlideChange}
        speed={800}
        draggable={false}
      >
        {allSlides.map((slide, index) => {
          // Render trang bìa
          if (slide.isCover) {
            return (
              <div key="cover" className="story-cover-slide">
                <div
                  className="cover-background"
                  style={{ backgroundImage: `url(${slide.coverImage})` }}
                />
                <div className="cover-content">
                  <h1>{slide.title}</h1>
                  <p>{slide.head}</p>
                  <Button
                    type="primary"
                    size="large"
                    className="start-reading-btn"
                    onClick={handleStartReading}
                  >
                    Bắt đầu đọc
                  </Button>
                </div>
              </div>
            );
          }

          // Render trang kết thúc
          if (slide.isEnd) {
            return (
              <div key="end" className="story-end-slide">
                <div
                  className="cover-background"
                  style={{ backgroundImage: `url(${slide.coverImage})` }}
                />
                <div className="end-content">
                  <h2>Chúc mừng!</h2>
                  <p>Bạn đã đọc xong câu chuyện "{slide.title}"</p>
                  <div className="end-actions">
                    <Button className="end-btn reread" size="large" icon={<RedoOutlined />} onClick={handleReRead}>
                      Đọc lại
                    </Button>
                    <Button className="end-btn close" size="large" icon={<CloseOutlined />} onClick={handleClose}>
                      Đóng
                    </Button>
                  </div>
                </div>
              </div>
            );
          }

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
                  <div className="page-content">
                    <p>{slide.content}</p>
                  </div>
                  {slide.audio && (
                    <div className="audio-player">
                      <audio
                        controls
                        src={slide.audio}
                        ref={el => (audioRefs.current[index] = el)}
                        onEnded={() => handleAudioEnded(index)}
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