import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Spin, message, Button, Collapse } from 'antd';
import { Edit, UserPlus, MessageCircle, ChevronDown, UserCheck, Users } from 'lucide-react';
import { followUser, getProfile, getUserById } from '../../service/userService';
import { getPostsByUserId } from '../../service/postService';
import './ProfilePage.scss';
import UserPostFeed from '../../components/UserPostFeed/UserPostFeed';
import EditProfileModal from '../../components/EditProfileModal/EditProfileModal';
import ChangePasswordPopup from '../../components/ChangePasswordPopup/ChangePasswordPopup';
import { findOrCreateConversation } from '../../service/messageService';

const { Panel } = Collapse;

const ProfilePage = () => {
  const { userId } = useParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const [editVisible, setEditVisible] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const [isFollowing, setIsFollowing] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const [chatLoading, setChatLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const fetchUserPosts = useCallback(async (id) => {
    setLoadingPosts(true);
    try {
      const res = await getPostsByUserId(id);
      if (res.success) {
        setPosts(res.posts);
      } else {
        message.error("Không thể tải bài đăng của người dùng này.");
      }
    } catch (error) {
      message.error("Lỗi khi tải bài đăng.");
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const meRes = await getProfile();
        setCurrentUser(meRes);

        const targetUserId = userId || meRes._id;

        const profileRes = await getUserById(targetUserId);
        if (profileRes.success) {
          setProfileUser(profileRes.user);
          setIsOwner(meRes._id === profileRes.user._id);

          const amIFollowingThem = profileRes.user.followers?.includes(meRes._id);
          const areTheyFollowingMe = profileRes.user.following?.includes(meRes._id);

          setIsFollowing(amIFollowingThem);
          setIsFriend(amIFollowingThem && areTheyFollowingMe);

          fetchUserPosts(profileRes.user._id);
        } else {
          message.error("Không tìm thấy người dùng này.");
          setLoadingPosts(false);
        }
      } catch (error) {
        message.error("Lỗi khi tải thông tin trang cá nhân.");
        setLoadingPosts(false);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId, fetchUserPosts]);

  const getInitials = (name) => {
    if (!name) return "?";
    const words = name.split(' ');
    if (words.length > 1) {
      return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleFollowToggle = async () => {
    if (followLoading) return;
    setFollowLoading(true);

    const prevFollowing = isFollowing;
    const prevFriend = isFriend;
    const prevProfileUser = { ...profileUser };

    const newIsFollowing = !prevFollowing;
    const areTheyFollowingMe = profileUser.following?.includes(currentUser._id);
    const newIsFriend = newIsFollowing && areTheyFollowingMe;

    setIsFollowing(newIsFollowing);
    setIsFriend(newIsFriend);

    setProfileUser(prev => ({
      ...prev,
      followers: newIsFollowing
        ? [...(prev.followers || []), currentUser._id]
        : (prev.followers || []).filter(id => id !== currentUser._id)
    }));

    try {
      const res = await followUser(profileUser._id);
      if (res.success) {
      } else {
        setIsFollowing(prevFollowing);
        setIsFriend(prevFriend);
        setProfileUser(prevProfileUser);
        message.error(res.error || "Thao tác thất bại.");
      }
    } catch (error) {
      setIsFollowing(prevFollowing);
      setIsFriend(prevFriend);
      setProfileUser(prevProfileUser);
      message.error("Đã xảy ra lỗi.");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleStartChat = async () => {
    setChatLoading(true);
    try {
      const res = await findOrCreateConversation(profileUser._id);
      if (res.success) {
        navigate('/home/chat');
      } else {
        message.error(res.error || "Không thể bắt đầu trò chuyện.");
      }
    } catch (error) {
      message.error("Đã xảy ra lỗi khi tạo cuộc trò chuyện.");
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (location.hash && posts.length > 0 && !loadingPosts) {
      const postId = location.hash.substring(1);
      setTimeout(() => {
        const postElement = document.getElementById(postId);

        if (postElement) {
          postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          postElement.classList.add('highlight-post');
          setTimeout(() => {
            postElement.classList.remove('highlight-post');
          }, 2500);
        } else {
          console.warn(`Không tìm thấy bài viết với ID: ${postId}`);
        }
      }, 500);
    }
  }, [location.hash, posts, loadingPosts]);

  if (loading) {
    return <div className="profile-loading"><Spin size="large" /></div>;
  }
  if (!profileUser) {
    return <div className="profile-loading"><h2>Không tìm thấy người dùng</h2></div>;
  }

  let followButtonText = 'Theo dõi';
  let followButtonIcon = <UserPlus size={16} />;
  let followButtonClass = 'follow-btn';

  if (isFriend) {
    followButtonText = 'Bạn bè';
    followButtonIcon = <Users size={16} />;
    followButtonClass = 'friend-btn';
  } else if (isFollowing) {
    followButtonText = 'Đang theo dõi';
    followButtonIcon = <UserCheck size={16} />;
    followButtonClass = 'unfollow-btn';
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-info">
            {profileUser && profileUser.pfp ? (
              <img className="profile-avatar" src={profileUser.pfp} alt={profileUser.name} />
            ) : (
              <div className="profile-avatar-initials">
                {getInitials(profileUser?.name)}
              </div>
            )}
            <div>
              <h2 className="username">{profileUser.name}</h2>
              <div className="follower-info">
                <span>{profileUser.followers?.length || 0} Người theo dõi</span>
                <span>Đang theo dõi {profileUser.following?.length || 0}</span>
              </div>
            </div>
          </div>

          <div className="profile-actions">
            {isOwner ? (
              <>
                <Button className="profile-btn edit-btn" icon={<Edit size={16} />} onClick={() => setEditVisible(true)}>
                  Chỉnh sửa hồ sơ
                </Button>
                <Button className="profile-btn" onClick={() => setPasswordVisible(true)}>
                  Đổi mật khẩu
                </Button>
              </>
            ) : (
              <>
                <Button
                  className={`profile-btn ${followButtonClass}`}
                  icon={followButtonIcon}
                  onClick={handleFollowToggle}
                  loading={followLoading}
                >
                  {followButtonText}
                </Button>
                <Button
                  className="profile-btn"
                  icon={<MessageCircle size={16} />}
                  onClick={handleStartChat}
                  loading={chatLoading}
                >
                  Nhắn tin
                </Button>
              </>
            )}
          </div>
        </div>

        {isOwner && (
          <Collapse bordered={false} className="profile-collapse" expandIcon={({ isActive }) => <ChevronDown className={`toggle-icon ${isActive ? 'open' : ''}`} />}>
            <Panel header="Thông tin chi tiết" key="1" className="details-panel">
              <div className="details-content">
                <div className="detail-item">
                  <span className="label">Email:</span>
                  <span className="value">{profileUser.email}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Giới tính:</span>
                  <span className="value">{profileUser.gender || 'Chưa cập nhật'}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Địa chỉ:</span>
                  <span className="value">{profileUser.address || 'Chưa cập nhật'}</span>
                </div>
              </div>
            </Panel>
          </Collapse>
        )}

        <UserPostFeed
          posts={posts}
          loading={loadingPosts}
          currentUser={currentUser}
          onUpdatePost={setPosts}
        />
      </div>

      {isOwner && (
        <>
          <EditProfileModal
            open={editVisible}
            onClose={() => setEditVisible(false)}
            currentUser={profileUser}
            onUpdate={(updatedUser) => {
              setProfileUser(updatedUser);
              setEditVisible(false);
              message.success("Cập nhật thông tin thành công!");
            }}
          />
          <ChangePasswordPopup
            open={passwordVisible}
            onClose={() => setPasswordVisible(false)}
          />
        </>
      )}
    </div>
  );
};

export default ProfilePage;