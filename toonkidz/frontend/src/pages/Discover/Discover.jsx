import React, { useState, useEffect } from "react";
import { Spin, message, Dropdown, Modal, Menu, Rate } from "antd";
import { FaHeart, FaCommentAlt, FaShareAlt, FaStar, FaPaperPlane } from "react-icons/fa";
import { getProfile } from "../../service/authService";
import { getPosts, likePost, addComment, editComment, deleteComment } from "../../service/postService";
import StoryDetailModal from "../../components/StoryDetailModal/StoryDetailModal";
import { BsThreeDotsVertical } from "react-icons/bs";
import Swal from 'sweetalert2';
import 'sweetalert2/src/sweetalert2.scss';
import "./Discover.scss";

const Discover = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [openCommentsId, setOpenCommentsId] = useState(null);
    const [inputs, setInputs] = useState({});
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedStory, setSelectedStory] = useState(null);
    const [editingComment, setEditingComment] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [postsRes, profileRes] = await Promise.all([getPosts(), getProfile()]);
                if (postsRes.success) {
                    setPosts(postsRes.posts);
                } else {
                    message.error(postsRes.error || "Không thể tải bài đăng.");
                }
                if (profileRes._id) {
                    setCurrentUser(profileRes);
                }
            } catch (error) {
                message.error("Đã xảy ra lỗi khi tải dữ liệu.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const updatePostInState = (updatedPost) => {
        setPosts(prevPosts => prevPosts.map(p => p._id === updatedPost._id ? updatedPost : p));
    };

    const handleToggleLike = async (postId) => {
        if (!currentUser) return message.warning("Bạn cần đăng nhập để thực hiện thao tác này.");
        const originalPosts = JSON.parse(JSON.stringify(posts));
        const updatedPosts = posts.map(p => {
            if (p._id === postId) {
                const isLiked = p.likes.includes(currentUser._id);
                const newLikes = isLiked ? p.likes.filter(id => id !== currentUser._id) : [...p.likes, currentUser._id];
                return { ...p, likes: newLikes };
            }
            return p;
        });
        setPosts(updatedPosts);
        try {
            await likePost(postId);
        } catch (error) {
            message.error("Thao tác thất bại, vui lòng thử lại.");
            setPosts(originalPosts);
        }
    };

    const handleSendOrUpdateComment = async (postId) => {
        const isEditing = editingComment && editingComment.postId === postId;
        if (isEditing) {
            handleUpdateComment(postId);
        } else {
            handleAddNewComment(postId);
        }
    };

    const handleAddNewComment = async (postId) => {
        const data = inputs[postId];
        if (!data || !data.text?.trim() || !data.rating) {
            return message.warning("Vui lòng nhập nội dung và đánh giá sao.");
        }
        try {
            const res = await addComment(postId, { text: data.text.trim(), rating: data.rating });
            if (res.success) {
                updatePostInState(res.post);
                setInputs(prev => ({ ...prev, [postId]: { text: "", rating: 0 } }));
                message.success("Đã gửi bình luận!");
            } else {
                message.error(res.error || "Gửi bình luận thất bại.");
            }
        } catch (error) {
            message.error("Đã xảy ra lỗi khi gửi bình luận.");
        }
    };

    const handleUpdateComment = async (postId) => {
        const data = inputs[postId];
        if (!data || !data.text?.trim() || !data.rating) {
            return message.warning("Vui lòng nhập nội dung và đánh giá sao.");
        }
        try {
            const res = await editComment(postId, editingComment.commentId, { text: data.text.trim(), rating: data.rating });
            if (res.success) {
                updatePostInState(res.post);
                message.success("Đã cập nhật bình luận.");
                handleCancelEdit(postId);
            } else {
                message.error(res.error || "Cập nhật thất bại.");
            }
        } catch (error) {
            message.error("Đã xảy ra lỗi khi cập nhật.");
        }
    };

    const toggleComments = (id) => setOpenCommentsId(prev => (prev === id ? null : id));
    const handleViewStory = (story) => { setSelectedStory(story); setIsViewModalOpen(true); };
    const handleCloseModal = () => setIsViewModalOpen(false);
    const handleInputChange = (storyId, value) => {
        setInputs((prev) => ({ ...prev, [storyId]: { ...(prev[storyId] || { text: "", rating: 0 }), text: value } }));
    };
    const handleSetRating = (storyId, rating) => {
        setInputs((prev) => ({ ...prev, [storyId]: { ...(prev[storyId] || { text: "", rating: 0 }), rating } }));
    };

    const handleStartEdit = (comment, postId) => {
        setOpenCommentsId(postId);
        setEditingComment({ postId, commentId: comment._id });
        setInputs(prev => ({ ...prev, [postId]: { text: comment.text, rating: comment.rating } }));
        setTimeout(() => document.querySelector(`#textarea-${postId}`)?.focus(), 100);
    };

    const handleDeleteComment = (postId, commentId) => {
        Swal.fire({
            title: 'Bạn chắc chắn muốn xóa?',
            text: "Hành động này không thể hoàn tác!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Vâng, xóa nó!',
            cancelButtonText: 'Hủy'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await deleteComment(postId, commentId);
                    if (res.success) {
                        updatePostInState(res.post);
                        message.success("Đã xóa bình luận.");
                    } else {
                        message.error(res.error || "Xóa thất bại.");
                    }
                } catch {
                    message.error("Đã xảy ra lỗi khi xóa.");
                }
            }
        });
    };

    const handleCancelEdit = (postId) => {
        setEditingComment(null);
        setInputs(prev => ({ ...prev, [postId]: { text: "", rating: 0 } }));
    };

    const handleReportComment = (commentId) => {
        message.success(`Đã báo cáo bình luận (ID: ${commentId}). Cảm ơn bạn!`);
    };

    const renderCommentMenu = (comment, post) => {
        const isOwnerOrAdmin = currentUser && (currentUser._id === comment.userId._id || currentUser.role === 'admin');
        if (isOwnerOrAdmin) {
            return (
                <Menu>
                    <Menu.Item key="edit" onClick={() => handleStartEdit(comment, post._id)}>
                        Chỉnh sửa
                    </Menu.Item>
                    <Menu.Item key="delete" danger onClick={() => handleDeleteComment(post._id, comment._id)}>
                        Xoá
                    </Menu.Item>
                </Menu>
            );
        }
        return (
            <Menu>
                <Menu.Item key="report" onClick={() => handleReportComment(comment._id)}>
                    Báo cáo bình luận này
                </Menu.Item>
            </Menu>
        );
    };

    if (loading) {
        return <div className="discover-loading"><Spin size="large" /></div>;
    }

    return (
        <>
            <div className="discover-container">
                <div className="discover-header">
                    <div>
                        <h1>Khám phá</h1>
                        <p>Chia sẻ và khám phá những câu chuyện đặc biệt dành cho bé</p>
                    </div>
                    <button className="share-btn">Chia sẻ truyện</button>
                </div>
                <div className="story-list">
                    {posts.length > 0 ? posts.map((post) => {
                        const { storyId: story, userId: author } = post;
                        if (!story || !author) return null;

                        const isLiked = currentUser ? post.likes.includes(currentUser._id) : false;
                        const open = openCommentsId === post._id;
                        const input = inputs[post._id] || { text: "", rating: 0 };
                        const isEditingThisPost = editingComment && editingComment.postId === post._id;

                        return (
                            <div key={post._id} className="story-card">
                                <div className="story-content">
                                    <div className="author-info">
                                        <img className="avatar" src={author.pfp || 'https://www.svgrepo.com/show/452030/avatar-default.svg'} alt={author.name} />
                                        <div className="author-details">
                                            <h4>{author.name}</h4>
                                            <p>{new Date(post.createdAt).toLocaleString('vi-VN')}</p>
                                        </div>
                                    </div>
                                    {post.caption && <p className="story-caption">{post.caption}</p>}
                                    <div className="story-meta">
                                        <p><strong>Tên truyện:</strong> {story.title}</p>
                                        <p><strong>Thể loại:</strong> <span className="meta-theme">{story.theme}</span></p>
                                        <p><strong>Giới thiệu:</strong> {story.head}</p>
                                    </div>
                                    <button className="read-btn" onClick={() => handleViewStory(story)}>Đọc truyện ngay</button>
                                    <div className="story-actions">
                                        <button className={`action-btn like ${isLiked ? "liked" : ""}`} onClick={() => handleToggleLike(post._id)}>
                                            <FaHeart /> <span>{post.likes.length}</span>
                                        </button>
                                        <button className={`action-btn comment ${open ? "open" : ""}`} onClick={() => toggleComments(post._id)}>
                                            <FaCommentAlt /> <span>{post.comments.length}</span>
                                        </button>
                                        <button className="action-btn share">
                                            <FaShareAlt /> <span>{post.shares}</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="story-image-container">
                                    {story.ratingAvg > 0 && (
                                        <div className="story-rating-overlay">
                                            <span>{story.ratingAvg.toFixed(1)}</span>
                                            <FaStar />
                                        </div>
                                    )}
                                    <img src={story.coverImage} alt={story.title} onClick={() => handleViewStory(story)} />
                                </div>
                                {open && (
                                    <div className="comments-inline">
                                        <div id={`comments-${post._id}`} className="existing-comments">
                                            {post.comments.length ? (
                                                post.comments.map((c) => (
                                                    <div key={c._id} className="comment-row">
                                                        <img className="c-avatar" src={c.userId.pfp || 'https://www.svgrepo.com/show/452030/avatar-default.svg'} alt={c.userId.name} />
                                                        <div className="c-body">
                                                            <div className="c-top">
                                                                <strong className="c-user">{c.userId.name}</strong>
                                                                <span className="c-date"> • {new Date(c.createdAt).toLocaleDateString()}</span>
                                                            </div>
                                                            <div className="c-stars">
                                                                <Rate disabled value={c.rating} />
                                                            </div>
                                                            <div className="c-text">{c.text}</div>
                                                        </div>
                                                        <div className="c-actions-menu">
                                                            <Dropdown overlay={renderCommentMenu(c, post)} trigger={['click']}>
                                                                <button className="c-action-btn" onClick={e => e.preventDefault()}>
                                                                    <BsThreeDotsVertical />
                                                                </button>
                                                            </Dropdown>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="no-comments">Chưa có bình luận nào.</div>
                                            )}
                                        </div>
                                        <div className="comment-compose">
                                            <img className="c-avatar small" src={currentUser?.pfp || 'https://www.svgrepo.com/show/452030/avatar-default.svg'} alt="Bạn" />
                                            <div className="compose-box">
                                                {isEditingThisPost && (
                                                    <div className="editing-state">
                                                        <span>Đang sửa bình luận...</span>
                                                        <button onClick={() => handleCancelEdit(post._id)}>Hủy</button>
                                                    </div>
                                                )}
                                                <textarea
                                                    id={`textarea-${post._id}`}
                                                    rows={1}
                                                    placeholder="Viết bình luận của bạn..."
                                                    value={input.text}
                                                    onChange={(e) => handleInputChange(post._id, e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter" && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleSendOrUpdateComment(post._id);
                                                        }
                                                    }}
                                                />
                                                <div className="compose-bottom">
                                                    <Rate value={input.rating} onChange={(value) => handleSetRating(post._id, value)} />
                                                    <button className="send-circle" onClick={() => handleSendOrUpdateComment(post._id)}>
                                                        {isEditingThisPost ? '✓' : <FaPaperPlane />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    }) : (
                        <div className="no-posts-found">
                            <h2>Chưa có bài đăng nào</h2>
                            <p>Hãy là người đầu tiên chia sẻ một câu chuyện!</p>
                        </div>
                    )}
                </div>
            </div>
            <StoryDetailModal
                story={selectedStory}
                open={isViewModalOpen}
                onClose={handleCloseModal}
            />
        </>
    );
};

export default Discover;