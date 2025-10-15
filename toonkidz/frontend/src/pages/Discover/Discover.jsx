import React, { useState } from "react";
import "./Discover.scss";
import {
    FaHeart,
    FaCommentAlt,
    FaShareAlt,
    FaStar,
    FaPaperPlane,
} from "react-icons/fa";

const Discover = () => {
    const [stories, setStories] = useState([
        {
            id: 1,
            author: "Alexa Rawles",
            date: "20/09/2023 - 11:40",
            title: "Rùa và thỏ",
            genre: "Động vật",
            description: "Truyện kể về cuộc đua giữa rùa và thỏ...",
            image: "/images/stories/turtle-rabbit-squirrel.jpg",
            likes: 133,
            shares: 10,
            liked: false,
            comments: [
                {
                    id: 1,
                    user: "Ngọc",
                    date: "21/09/2023",
                    text: "Truyện thật ý nghĩa!",
                    rating: 5,
                },
                {
                    id: 2,
                    user: "Lan",
                    date: "22/09/2023",
                    text: "Rất hay, bé thích lắm.",
                    rating: 5,
                },
            ],
        },
        {
            id: 2,
            author: "Alexa Rawles",
            date: "20/09/2023 - 11:40",
            title: "Rùa và thỏ 2",
            genre: "Động vật",
            description: "Phiên bản tiếp theo...",
            image: "/images/stories/turtle-rabbit-squirrel.jpg",
            likes: 45,
            shares: 2,
            liked: false,
            comments: [],
        },
    ]);

    // which story's inline comments open
    const [openCommentsId, setOpenCommentsId] = useState(null);

    // compose inputs per story { [id]: { text, rating } }
    const [inputs, setInputs] = useState({});

    // hover preview rating per story for composing { [id]: hoverNumber }
    const [hoverRatings, setHoverRatings] = useState({});

    // Toggle like
    const toggleLike = (id) => {
        setStories((prev) =>
            prev.map((s) =>
                s.id === id ? { ...s, liked: !s.liked, likes: s.liked ? s.likes - 1 : s.likes + 1 } : s
            )
        );
    };

    // Toggle open inline comments
    const toggleComments = (id) => {
        setOpenCommentsId((prev) => (prev === id ? null : id));
        setInputs((prev) => ({ ...prev, [id]: prev[id] || { text: "", rating: 5 } }));

        // scroll to comments after short delay so DOM has rendered
        setTimeout(() => {
            const el = document.getElementById(`comments-${id}`);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 120);
    };

    // Share action
    const handleShare = (title) => {
        alert(`Bạn đã chia sẻ truyện "${title}"`);
    };

    // Compose handlers
    const handleInputChange = (storyId, value) => {
        setInputs((prev) => ({
            ...prev,
            [storyId]: { ...(prev[storyId] || { text: "", rating: 5 }), text: value },
        }));
    };

    const handleSetRating = (storyId, rating) => {
        setInputs((prev) => ({
            ...prev,
            [storyId]: { ...(prev[storyId] || { text: "", rating: 5 }), rating },
        }));
    };

    const handleSendComment = (storyId) => {
        const data = inputs[storyId] || { text: "", rating: 5 };
        if (!data.text || !data.text.trim()) return;

        const newComment = {
            id: Date.now(),
            user: "Bạn",
            date: new Date().toLocaleDateString(),
            text: data.text.trim(),
            rating: data.rating || 0,
        };

        setStories((prev) =>
            prev.map((s) => (s.id === storyId ? { ...s, comments: [...s.comments, newComment] } : s))
        );

        setInputs((prev) => ({ ...prev, [storyId]: { text: "", rating: data.rating || 5 } }));

        // scroll to bottom of comment area so the new comment is visible
        setTimeout(() => {
            const el = document.getElementById(`comments-${storyId}`);
            if (el) {
                el.scrollTop = el.scrollHeight;
            }
        }, 80);
    };

    const handleStarMouseEnter = (storyId, n) => {
        setHoverRatings((prev) => ({ ...prev, [storyId]: n }));
    };
    const handleStarMouseLeave = (storyId) => {
        setHoverRatings((prev) => ({ ...prev, [storyId]: 0 }));
    };

    return (
        <div className="discover-container">
            <div className="discover-header">
                <div>
                    <h1>Discover</h1>
                    <p>Share and explore special comic stories for kids</p>
                </div>
                <button className="share-btn">Share Story</button>
            </div>

            <div className="story-list">
                {stories.map((story) => {
                    const input = inputs[story.id] || { text: "", rating: 5 };
                    const hover = hoverRatings[story.id] || 0;
                    const open = openCommentsId === story.id;

                    return (
                        <div key={story.id} className="story-card">
                            <div className="story-info">
                                <div className="author-info">
                                    <div className="avatar" />
                                    <div className="author-details">
                                        <h4>{story.author}</h4>
                                        <p>{story.date}</p>
                                    </div>
                                </div>

                                <p className="story-text">Mọi người tham khảo truyện mình mới tạo nha...</p>

                                <div className="story-meta">
                                    <p>
                                        <strong>Tên truyện:</strong> {story.title}
                                    </p>
                                    <p>
                                        <strong>Thể loại:</strong> {story.genre}
                                    </p>
                                    <p>
                                        <strong>Giới thiệu:</strong> {story.description}
                                    </p>
                                </div>

                                <a href="#" className="read-link">
                                    Đọc truyện ngay
                                </a>

                                <div className="story-actions">
                                    <button
                                        className={`action-btn like ${story.liked ? "liked" : ""}`}
                                        onClick={() => toggleLike(story.id)}
                                        aria-label="Like"
                                    >
                                        <FaHeart /> <span>{story.likes}</span>
                                    </button>

                                    <button
                                        className={`action-btn comment ${open ? "open" : ""}`}
                                        onClick={() => toggleComments(story.id)}
                                        aria-label="Comments"
                                    >
                                        <FaCommentAlt /> <span>{story.comments.length}</span>
                                    </button>

                                    <button className="action-btn share" onClick={() => handleShare(story.title)} aria-label="Share">
                                        <FaShareAlt /> <span>{story.shares}</span>
                                    </button>
                                </div>

                                {/* Inline comments area (only render when open) */}
                                {open && (
                                    <div className="comments-inline">
                                        <div
                                            id={`comments-${story.id}`}
                                            className="existing-comments"
                                            // allow scrolling within this box
                                            style={{ maxHeight: 260, overflowY: "auto" }}
                                        >
                                            {story.comments.length ? (
                                                story.comments.map((c) => (
                                                    <div key={c.id} className="comment-row">
                                                        <div className="c-avatar" />
                                                        <div className="c-body">
                                                            <div className="c-top">
                                                                <strong className="c-user">{c.user}</strong>
                                                                <span className="c-date"> • {c.date}</span>
                                                            </div>

                                                            {/* FORCE horizontal layout for stars via inline style */}
                                                            <div className="c-stars" style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                                                {Array.from({ length: 5 }).map((_, i) => (
                                                                    <FaStar key={i} className={`star ${i < c.rating ? "filled" : ""}`} />
                                                                ))}
                                                            </div>

                                                            <div className="c-text">{c.text}</div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="no-comments">Chưa có bình luận nào.</div>
                                            )}
                                        </div>

                                        <div className="comment-compose">
                                            <div className="c-avatar small" />
                                            <div className="compose-box">
                                                <textarea
                                                    rows={2}
                                                    placeholder="Viết bình luận của bạn..."
                                                    value={input.text}
                                                    onChange={(e) => handleInputChange(story.id, e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter" && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleSendComment(story.id);
                                                        }
                                                    }}
                                                />

                                                <div className="compose-bottom">
                                                    {/* FORCE horizontal layout for rating via inline style */}
                                                    <div
                                                        className="rating"
                                                        onMouseLeave={() => handleStarMouseLeave(story.id)}
                                                        style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "nowrap" }}
                                                    >
                                                        {Array.from({ length: 5 }).map((_, i) => {
                                                            const r = i + 1;
                                                            const active = hover ? r <= hover : r <= (input.rating || 0);
                                                            return (
                                                                <FaStar
                                                                    key={i}
                                                                    className={`star selectable ${active ? "filled" : ""}`}
                                                                    onMouseEnter={() => handleStarMouseEnter(story.id, r)}
                                                                    onClick={() => handleSetRating(story.id, r)}
                                                                    style={{ cursor: "pointer" }}
                                                                />
                                                            );
                                                        })}
                                                    </div>

                                                    <button className="send-circle" onClick={() => handleSendComment(story.id)} aria-label="Send">
                                                        <FaPaperPlane />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {/* end inline comments */}
                            </div>

                            <div className="story-image">
                                <img src={story.image} alt={story.title} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Discover;
