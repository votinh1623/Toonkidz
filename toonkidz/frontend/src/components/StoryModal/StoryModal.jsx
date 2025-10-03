import React, { useRef, useEffect } from "react";
import { Modal, Carousel, Tag } from "antd";
import "./StoryModal.scss";

const StoryModal = ({ open, onClose, pages }) => {
  const carouselRef = useRef(null);

  useEffect(() => {
    if (open && carouselRef.current) {
      carouselRef.current.goTo(0, true);
    }
  }, [open]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      className="story-modal"
      style={{ top: 20 }}
    >
      <Carousel
        ref={carouselRef}
        dots={true}
        infinite={false}
        arrows={true}
        autoplay
        autoplaySpeed={3000}
      >
        {pages.map((page) => (
          <div key={page.id} className="story-slide">
            {/* Image + Audio */}
            <div className="image-audio-wrapper">
              <div className="image-container">
                <img src={page.image} alt={`page-${page.id}`} />
              </div>
              <div className="audio-vocab-container">
                <audio controls src={page.audio} />
                <h4>TỪ VỰNG TRONG TRUYỆN</h4>
                <div className="vocab-tags">
                  {page.vocab.map((v, index) => (
                    <Tag key={index} color="purple">
                      {v.label}: <b>{v.value}</b>
                    </Tag>
                  ))}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="page-content">
              <p>{page.content}</p>
            </div>
          </div>
        ))}
      </Carousel>
    </Modal>
  );
};

export default StoryModal;