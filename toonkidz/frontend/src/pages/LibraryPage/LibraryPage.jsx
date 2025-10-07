import React, { useState } from 'react';
import './LibraryPage.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart as faHeartSolid } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';


const LibraryPage = () => {
  const [favorites, setFavorites] = useState([]);

  const comics = [
    {
      id: "1",
      title: "Rùa và Thỏ",
      type: "Động vật",
      description: "Rùa và thỏ thử sức trong 1 cuộc đua",
      img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQua-w3JoFuUxwM7l1lgT378ScRQp2l_9l0IQ&s",
    },
    {
      id: "2",
      title: "Rùa và Thỏ",
      type: "Động vật",
      description: "Rùa và thỏ thử sức trong 1 cuộc đua",
      img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQua-w3JoFuUxwM7l1lgT378ScRQp2l_9l0IQ&s",
    },
    {
      id: "3",
      title: "Rùa và Thỏ",
      type: "Động vật",
      description: "Rùa và thỏ thử sức trong 1 cuộc đua",
      img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQua-w3JoFuUxwM7l1lgT378ScRQp2l_9l0IQ&s",
    },
    {
      id: "4",
      title: "Rùa và Thỏ",
      type: "Động vật",
      description: "Rùa và thỏ thử sức trong 1 cuộc đua",
      img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQua-w3JoFuUxwM7l1lgT378ScRQp2l_9l0IQ&s",
    },
    {
      id: "5",
      title: "Rùa và Thỏ",
      type: "Động vật",
      description: "Rùa và thỏ thử sức trong 1 cuộc đua",
      img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQua-w3JoFuUxwM7l1lgT378ScRQp2l_9l0IQ&s",
    },
    {
      id: "6",
      title: "Rùa và Thỏ",
      type: "Động vật",
      description: "Rùa và thỏ thử sức trong 1 cuộc đua",
      img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQua-w3JoFuUxwM7l1lgT378ScRQp2l_9l0IQ&s",
    },
  ];


  const toggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id)
        ? prev.filter((favId) => favId !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="library">
      <div className="library__title">Thư viện</div>

      <div className="library__tabs">
        <div className="library__tabs__yourcomic">Truyện của bạn</div>
        <div className="library__tabs__favourite">Yêu thích</div>
      </div>

      <div className="library__comics">
        {comics.map((item) => (
          <div className="library__comics__item" key={item.id}>
            <div className="library__comics__item__img">
              <img src={item.img} alt={item.title} />

            </div>
            <div
              className={`library__comics__item__fav ${favorites.includes(item.id) ? "active" : ""
                }`}
              onClick={() => toggleFavorite(item.id)}
            >
              <FontAwesomeIcon icon={faHeartSolid} />
            </div>


            <div className="library__comics__item__title">{item.title}</div>
            <div className="library__comics__item__type">{item.type}</div>
            <div className="library__comics__item__description">
              {item.description}
            </div>

            <button className="library__comics__item__read">Đọc truyện</button>

            <div className="library__comics__item__button">
              <button className="library__comics__item__button__share">Chia sẻ</button>
              <button className="library__comics__item__button__delete">Xóa</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LibraryPage;