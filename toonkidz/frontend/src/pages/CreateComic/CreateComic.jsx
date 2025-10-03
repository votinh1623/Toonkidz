import React, { useState } from 'react'
import { Checkbox, Slider, Input } from 'antd';
import "./CreateComic.scss";
import StoryModal from '../../components/StoryModal/StoryModal';

const { TextArea } = Input;

const storyPages = [
  {
    id: 1,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSjimz1tFRGev379nrpcCfs4pVtL3_YQ4Zf3g&s",
    audio: "/audios/page1.mp3",
    vocab: [
      { label: "Con thỏ", value: "Rabbit" },
      { label: "Con rùa", value: "Turtle" },
      { label: "Cây", value: "Tree" },
    ],
    content: "Ngày xưa xửa xưa, có chú thỏ (Rabbit) và rùa (Turtle) đã tranh cãi...",
  },
  {
    id: 2,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQua-w3JoFuUxwM7l1lgT378ScRQp2l_9l0IQ&s",
    audio: "/audios/page2.mp3",
    vocab: [
      { label: "Đường đua", value: "Race track" },
      { label: "Cỏ", value: "Grass" },
    ],
    content: "Cuộc đua bắt đầu, thỏ phóng rất nhanh, còn rùa thì chậm chạp bước từng bước...",
  }
];

const CreateComic = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="create-comic">

        <div className="create-comic__slide">
          <div className="create-comic__slide__title">Tạo truyện với AI</div>
          <div className="create-comic__slide__subtitle">
            Hãy để AI giúp bé tạo ra những câu chuyện tuyệt vời!
            Chỉ cần nhập ý tưởng và AI sẽ biến thành truyện hoàn chỉnh
          </div>
        </div>

        <div className="create-comic__main">
          <div className="create-comic__main__left">

            <div className="create-comic__main__left__genre">
              <p>Thể loại truyện</p>
              <div className="create-comic__main__left__genre-grid">
                <div className="genre-item fairy">Cổ tích</div>
                <div className="genre-item adventure">Phiêu lưu</div>
                <div className="genre-item animals">Động vật</div>
                <div className="genre-item science">Khoa học</div>
                <div className="genre-item nature">Thiên nhiên</div>
                <div className="genre-item music">Âm nhạc</div>
              </div>
            </div>

            <div className="create-comic__main__left__setting">
              <p>Cài đặt truyện</p>

              <div className="create-comic__main__left__suggest">
                <p>Gợi ý từ: Mèo, chó</p>
                <div className="create-comic__main__left__suggest__list">
                  <div>Mèo</div>
                  <div>Chó</div>
                  <div>Lâu đài</div>
                  <div>Phù thuỷ</div>
                  <div>Hoàng tử</div>
                </div>
              </div>

              <div className="create-comic__main__left__age">
                <p>Độ tuổi:</p>
                <div className="create-comic__main__left__age__list">
                  <div>3-5</div>
                  <div>6-8</div>
                  <div>9-12</div>
                </div>
              </div>

              <div className="create-comic__main__left__audio">
                <Checkbox>Thêm audio</Checkbox>
              </div>

              <div className="create-comic__main__left__page">
                <label>Độ dài truyện:</label>
                <Slider defaultValue={1} max={7} />
              </div>

              <div className="create-comic__main__left__idea">
                <label>Ý tưởng truyện:</label>
                <TextArea rows={4} placeholder="Ví dụ: Rùa và Thỏ thi chạy..." />
              </div>

              <button>Tạo truyện ngay</button>
            </div>
          </div>

          <div className="create-comic__main-right">
            <div>Xem trước truyện</div>
            <p>Tên truyện: Rùa và Thỏ</p>
            <div className="create-comic__main-right__image">
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQLfiLHMKrx0MOx1TKhAjWSlDyZRx10URFZ6w&s"
                alt="Rùa và Thỏ"
              />
            </div>
            <p>Giới thiệu: Rùa đua với Thỏ, Rùa thắng</p>
            <button onClick={() => setOpen(true)}>Xem chi tiết</button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <StoryModal open={open} onClose={() => setOpen(false)} pages={storyPages} />
    </>
  )
}

export default CreateComic