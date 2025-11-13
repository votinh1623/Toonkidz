// src/pages/ProfilePage/UserPostFeed.jsx
import React, { useState, useEffect } from 'react';
import { Spin, message, Dropdown, Menu, Rate, Modal, Button } from 'antd';
import { FaHeart, FaCommentAlt, FaShareAlt, FaStar, FaPaperPlane } from 'react-icons/fa';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { likePost, addComment, editComment, deleteComment, deletePostApi, updatePostApi } from '../../service/postService';
import StoryDetailModal from '../../components/StoryDetailModal/StoryDetailModal';
import { GlobalOutlined, LockOutlined, TeamOutlined, EllipsisOutlined } from '@ant-design/icons';
import Swal from 'sweetalert2';
import 'sweetalert2/src/sweetalert2.scss';
import './UserPostFeed.scss'
import PostEditModal from '../PostEditModal/PostEditModal';
import { useLocation, useNavigate } from 'react-router-dom';
import ShareToProfileModal from '../ShareToProfileModal/ShareToProfileModal';
import ShareToChatModal from '../ShareToChatModal/ShareToChatModal';
import ShareOptionsModal from '../ShareOptionsModal/ShareOptionsModal';

const renderStars = (rating) => (
  Array.from({ length: 5 }).map((_, i) => (
    <FaStar key={i} className={`star ${i < rating ? "filled" : ""}`} />
  ))
);

const getInitials = (name) => {
  if (!name) return "?";
  const words = name.split(' ');
  if (words.length > 1) {
    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const UserPostFeed = ({ posts, loading, currentUser, onUpdatePost, isOwner }) => {
  const [livePosts, setLivePosts] = useState([]);
  const [openCommentsId, setOpenCommentsId] = useState(null);
  const [inputs, setInputs] = useState({});
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [editingComment, setEditingComment] = useState(null);

  const [isPostEditModalOpen, setIsPostEditModalOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState(null);

  const [shareOptionsOpen, setShareOptionsOpen] = useState(false);
  const [shareChatOpen, setShareChatOpen] = useState(false);
  const [shareProfileOpen, setShareProfileOpen] = useState(false);
  const [postToShare, setPostToShare] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setLivePosts(posts || []);
    if (location.hash && posts.length > 0) {
      const hashParts = location.hash.substring(1).split('&comment=');
      const postId = hashParts[0];
      const commentId = hashParts[1] || null;

      setTimeout(() => {
        const postElement = document.getElementById(postId);
        if (postElement) {
          postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          postElement.classList.add('highlight-post');

          if (commentId) {
            setOpenCommentsId(postId);

            setTimeout(() => {
              const commentElement = document.getElementById(commentId);
              if (commentElement) {
                commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                commentElement.classList.add('highlight-comment');
              }
            }, 500);
          }

          setTimeout(() => {
            postElement.classList.remove('highlight-post');
            if (commentId) {
              const commentElement = document.getElementById(commentId);
              commentElement?.classList.remove('highlight-comment');
            }
          }, 3000);
        }
      }, 500);
    }
  }, [posts]);

  const updatePostInState = (updatedPost) => {
    const newPosts = livePosts.map(p => p._id === updatedPost._id ? updatedPost : p);
    setLivePosts(newPosts);
    onUpdatePost(newPosts);
  };

  const handleNavigateToProfile = (userId) => {
    if (currentUser && currentUser._id === userId) {
      navigate('/home/profile');
    } else {
      navigate(`/home/profile/${userId}`);
    }
  };

  const handleToggleLike = async (postId) => {
    if (!currentUser) return message.warning("Bạn cần đăng nhập để thực hiện thao tác này.");
    const originalPosts = JSON.parse(JSON.stringify(livePosts));
    const updatedPosts = livePosts.map(p => {
      if (p._id === postId) {
        const isLiked = p.likes.includes(currentUser._id);
        const newLikes = isLiked ? p.likes.filter(id => id !== currentUser._id) : [...p.likes, currentUser._id];
        return { ...p, likes: newLikes };
      }
      return p;
    });
    setLivePosts(updatedPosts);
    try {
      await likePost(postId);
    } catch (error) {
      message.error("Thao tác thất bại, vui lòng thử lại.");
      setLivePosts(originalPosts);
    }
  };

  const handleDeletePost = (postId) => {
    Swal.fire({
      title: 'Xóa bài viết?',
      text: "Bạn không thể hoàn tác hành động này!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await deletePostApi(postId);
          if (res.success) {
            message.success("Đã xóa bài viết.");
            onUpdatePost(livePosts.filter(p => p._id !== postId));
          } else {
            message.error(res.error || "Xóa thất bại.");
          }
        } catch (error) {
          message.error("Lỗi kết nối.");
        }
      }
    });
  };

  const handleSendOrUpdateComment = async (postId) => {
    const isEditing = editingComment && editingComment.postId === postId;
    const data = inputs[postId];
    if (!data || !data.text?.trim() || !data.rating) {
      return message.warning("Vui lòng nhập nội dung và đánh giá sao.");
    }

    try {
      let res;
      if (isEditing) {
        res = await editComment(postId, editingComment.commentId, data);
      } else {
        res = await addComment(postId, data);
      }
      if (res.success) {
        updatePostInState(res.post);
        setInputs(prev => ({ ...prev, [postId]: { text: "", rating: 0 } }));
        setEditingComment(null);
        message.success(isEditing ? "Đã cập nhật bình luận!" : "Đã gửi bình luận!");
      } else {
        message.error(res.error || "Thao tác thất bại.");
      }
    } catch (error) {
      message.error("Đã xảy ra lỗi.");
    }
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

  const handlePostUpdate = (updatedPost) => {
    updatePostInState(updatedPost);
    setPostToEdit(null);
    setIsPostEditModalOpen(false);
  };

  const handleOpenEditModal = (post) => {
    setPostToEdit(post);
    setIsPostEditModalOpen(true);
  };

  const handleOpenShareOptions = (post) => {
    const postToActuallyShare = post.originalPostId ? post.originalPostId : post;
    let finalPostToShare = postToActuallyShare;
    if (post.originalPostId && !postToActuallyShare.userId) {
      finalPostToShare = post.originalPostId;
    } else {
      finalPostToShare = post;
    }
    if (post.postType === 'share' && post.originalPostId) {
      setPostToShare(post.originalPostId);
    } else {
      setPostToShare(post);
    }

    setShareOptionsOpen(true);
  };

  const handleShareToProfile = () => {
    setShareOptionsOpen(false);
    setShareProfileOpen(true);
  };

  const handleShareToChat = () => {
    setShareOptionsOpen(false);
    setShareChatOpen(true);
  };

  const renderCommentMenu = (comment, post) => {
    const isOwnerOrAdmin = currentUser && (currentUser._id === comment.userId._id || currentUser.role === 'admin');
    if (isOwnerOrAdmin) {
      return (
        <Menu>
          <Menu.Item key="edit" onClick={() => handleStartEdit(comment, post._id)}>Chỉnh sửa</Menu.Item>
          <Menu.Item key="delete" danger onClick={() => handleDeleteComment(post._id, comment._id)}>Xoá</Menu.Item>
        </Menu>
      );
    }
    return (
      <Menu>
        <Menu.Item key="report" onClick={() => handleReportComment(comment._id)}>Báo cáo</Menu.Item>
      </Menu>
    );
  };

  const renderPostMenu = (post) => {
    const isOwner = currentUser && currentUser._id === post.userId._id;
    if (isOwner) {
      return (
        <Menu>
          <Menu.Item key="edit" onClick={() => handleOpenEditModal(post)}>
            Chỉnh sửa bài viết
          </Menu.Item>
          <Menu.Item key="delete" danger onClick={() => handleDeletePost(post._id)}>
            Xóa bài viết
          </Menu.Item>
        </Menu>
      );
    }
    return (
      <Menu>
        <Menu.Item key="report" onClick={() => handleReportPost(post._id)}>
          Báo cáo bài viết
        </Menu.Item>
      </Menu>
    );
  };

  const toggleComments = (id) => setOpenCommentsId(prev => (prev === id ? null : id));
  const handleViewStory = (story) => { setSelectedStory(story); setIsViewModalOpen(true); };
  const handleCloseModal = () => setIsViewModalOpen(false);
  const handleInputChange = (postId, value) => {
    setInputs((prev) => ({ ...prev, [postId]: { ...(prev[postId] || { text: "", rating: 0 }), text: value } }));
  };
  const handleSetRating = (postId, rating) => {
    setInputs((prev) => ({ ...prev, [postId]: { ...(prev[postId] || { text: "", rating: 0 }), rating } }));
  };

  const OriginalPostContent = ({
    post,
    isLiked,
    open,
    handleToggleLike,
    toggleComments,
    handleOpenShareOptions,
    showActions = true
  }) => {
    const { storyId: story, userId: author } = post;
    if (!story || !author) return null;

    return (
      <div className="story-content">
        <div className="story-header-wrapper">
          <div className="author-info" onClick={() => handleNavigateToProfile(author._id)} style={{ cursor: 'pointer' }}>
            {author && author.pfp ? (
              <img className="avatar" src={author.pfp} alt={author.name} />
            ) : (
              <div className="avatar-initials">{getInitials(author?.name)}</div>
            )}
            <div className="author-details">
              <h4>{author.name}</h4>
              <p>
                {new Date(post.createdAt).toLocaleString('vi-VN')}
                <span className="post-visibility">
                  {post.visibility === 'public' && <GlobalOutlined />}
                  {post.visibility === 'friend' && <TeamOutlined />}
                  {post.visibility === 'private' && <LockOutlined />}
                </span>
              </p>
            </div>
          </div>
          <Dropdown overlay={renderPostMenu(post)} trigger={['click']} placement="bottomRight">
            <Button type="text" icon={<EllipsisOutlined style={{ fontSize: '20px' }} />} />
          </Dropdown>
        </div>
        {post.caption && <p className="story-caption">{post.caption}</p>}
        <div className="story-meta">
          <p><strong>Tên truyện:</strong> {story.title}</p>
          <p><strong>Thể loại:</strong> <span className="meta-theme">{story.theme}</span></p>
          <p><strong>Giới thiệu:</strong> {story.head}</p>
        </div>
        <button className="read-btn" onClick={() => handleViewStory(story)}>Đọc truyện ngay</button>

        {showActions && (
          <div className="story-actions">
            <button className={`action-btn like ${isLiked ? "liked" : ""}`} onClick={() => handleToggleLike(post._id)}>
              <FaHeart /> <span>{post.likes.length}</span>
            </button>
            <button className={`action-btn comment ${open ? "open" : ""}`} onClick={() => toggleComments(post._id)}>
              <FaCommentAlt /> <span>{post.comments.length}</span>
            </button>
            <button className="action-btn share" onClick={() => handleOpenShareOptions(post)}>
              <FaShareAlt /> <span>{post.shares || 0}</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  const SharedPostContent = ({
    post,
    isLiked,
    open,
    handleToggleLike,
    toggleComments,
    handleOpenShareOptions
  }) => {
    const { userId: sharer, originalPostId: originalPost, sharedCaption } = post;

    return (
      <div className="story-content">
        <div className="story-header-wrapper">
          <div className="author-info" onClick={() => handleNavigateToProfile(sharer._id)} style={{ cursor: 'pointer' }}>
            {sharer && sharer.pfp ? (
              <img className="avatar" src={sharer.pfp} alt={sharer.name} />
            ) : (
              <div className="avatar-initials">{getInitials(sharer?.name)}</div>
            )}
            <div className="author-details">
              <h4>{sharer.name}</h4>
              <p>
                {new Date(post.createdAt).toLocaleString('vi-VN')}
                <span className="post-visibility">
                  {post.visibility === 'public' && <GlobalOutlined />}
                  {post.visibility === 'friend' && <TeamOutlined />}
                  {post.visibility === 'private' && <LockOutlined />}
                </span>
              </p>
            </div>
          </div>
          <Dropdown overlay={renderPostMenu(post)} trigger={['click']} placement="bottomRight">
            <Button type="text" icon={<EllipsisOutlined style={{ fontSize: '20px' }} />} />
          </Dropdown>
        </div>

        {sharedCaption && <p className="story-caption">{sharedCaption}</p>}

        {originalPost ? (
          <div className="embedded-post-container">
            <OriginalPostContent post={originalPost} showActions={false} />
          </div>
        ) : (
          <div className="embedded-post-unavailable">
            <LockOutlined />
            <p>Nội dung này không có sẵn do cài đặt quyền riêng tư của tác giả.</p>
          </div>
        )}


        <div className="story-actions">
          <button className={`action-btn like ${isLiked ? "liked" : ""}`} onClick={() => handleToggleLike(post._id)}>
            <FaHeart /> <span>{post.likes.length}</span>
          </button>
          <button
            className={`action-btn comment ${open ? "open" : ""}`}
            onClick={() => toggleComments(post._id)}
            disabled={!originalPost}
            title={!originalPost ? "Không thể bình luận khi nội dung gốc bị ẩn" : "Bình luận"}
          >
            <FaCommentAlt /> <span>{post.comments.length}</span>
          </button>
          <button
            className="action-btn share"
            onClick={() => handleOpenShareOptions(post)}
            disabled={!originalPost}
            title={!originalPost ? "Bạn không thể chia sẻ bài viết này" : "Chia sẻ"}
          >
            <FaShareAlt /> <span>{post.shares || 0}</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="user-posts-section">
      <h3 className="section-title">Bài đăng</h3>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
          <Spin />
        </div>
      ) : (
        <div className="story-list">
          {livePosts.length > 0 ? livePosts.map((post) => {

            const { storyId, originalPostId, postType } = post;
            const isSharedPost = postType === 'share';

            const story = isSharedPost ? post.originalPostId?.storyId : post.storyId;

            if (!post.userId) {
              return null;
            }
            if (!isSharedPost && !story) {
              return null;
            }

            const isLiked = currentUser ? post.likes.includes(currentUser._id) : false;
            const open = openCommentsId === post._id;
            const input = inputs[post._id] || { text: "", rating: 0 };
            const isEditingThisPost = editingComment && editingComment.postId === post._id;


            return (
              <div key={post._id} id={post._id} className="story-card">
                {isSharedPost ? (
                  <SharedPostContent
                    post={post}
                    isLiked={isLiked}
                    open={open}
                    handleToggleLike={handleToggleLike}
                    toggleComments={toggleComments}
                    handleOpenShareOptions={handleOpenShareOptions}
                  />
                ) : (
                  <OriginalPostContent
                    post={post}
                    isLiked={isLiked}
                    open={open}
                    handleToggleLike={handleToggleLike}
                    toggleComments={toggleComments}
                    handleOpenShareOptions={handleOpenShareOptions}
                  />
                )}
                {story && (
                  <div className="story-image-container">
                    {story.ratingAvg > 0 && (
                      <div className="story-rating-overlay">
                        <span>{story.ratingAvg.toFixed(1)}</span>
                        <FaStar />
                      </div>
                    )}
                    <img src={story.coverImage} alt={story.title} onClick={() => handleViewStory(story)} />
                  </div>
                )}


                {open && (
                  <div className="comments-inline">
                    <div id={`comments-${post._id}`} className="existing-comments">
                      {post.comments.length ? (
                        post.comments.map((c) => (
                          <div key={c._id} id={c._id} className="comment-row">
                            <div
                              onClick={() => handleNavigateToProfile(c.userId._id)}
                              style={{ cursor: 'pointer' }}
                            >
                              {c.userId && c.userId.pfp ? (
                                <img className="avatar" src={c.userId.pfp} alt={c.userId.name} />
                              ) : (
                                <div className="avatar-initials">
                                  {getInitials(c.userId?.name)}
                                </div>
                              )}
                            </div>
                            <div className="c-body">
                              <div className="c-top">
                                <strong className="c-user" onClick={() => handleNavigateToProfile(c.userId._id)}
                                  style={{ cursor: 'pointer' }}
                                >
                                  {c.userId.name}
                                </strong>
                                <span className="c-date"> • {new Date(c.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="c-stars">
                                <Rate disabled value={c.rating} />
                              </div>
                              <div className="c-text">{c.text}</div>
                            </div>
                            <div className="c-actions-menu">
                              <Dropdown overlay={renderCommentMenu(c, post)} trigger={['click']}>
                                <button className="c-action-btn" onClick={e => e.preventDefault()}><BsThreeDotsVertical /></button>
                              </Dropdown>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="no-comments">Chưa có bình luận nào.</div>
                      )}
                    </div>
                    <div className="comment-compose">
                      {currentUser && currentUser.pfp ? (
                        <img className="avatar" src={currentUser.pfp} alt={currentUser.name} />
                      ) : (
                        <div className="avatar-initials">
                          {getInitials(currentUser?.name)}
                        </div>
                      )}
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
              <h3>Chưa có bài đăng nào</h3>
            </div>
          )}
        </div>
      )}

      <StoryDetailModal
        story={selectedStory}
        open={isViewModalOpen}
        onClose={handleCloseModal}
      />

      <PostEditModal
        open={isPostEditModalOpen}
        onClose={() => setIsPostEditModalOpen(false)}
        post={postToEdit}
        onUpdate={handlePostUpdate}
      />

      <ShareOptionsModal
        open={shareOptionsOpen}
        onClose={() => setShareOptionsOpen(false)}
        post={postToShare}
        onShareToProfile={handleShareToProfile}
        onShareToChat={handleShareToChat}
      />
      <ShareToProfileModal
        open={shareProfileOpen}
        onClose={() => setShareProfileOpen(false)}
        post={postToShare}
        onShared={(newPost) => {
          if (isOwner) {
            onUpdatePost([newPost, ...livePosts]);
          } else {
            message.success("Đã chia sẻ lên trang cá nhân của bạn!");
          }
          setShareProfileOpen(false);
        }}
      />
      <ShareToChatModal
        open={shareChatOpen}
        onClose={() => setShareChatOpen(false)}
        post={postToShare}
        currentUser={currentUser}
      />
    </div>
  );
};

export default UserPostFeed;