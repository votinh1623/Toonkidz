// src/pages/ProfilePage/ProfilePage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, message, Button, Collapse } from 'antd';
import { Edit, UserPlus, MessageCircle, ChevronDown, UserCheck } from 'lucide-react';
import { followUser, getProfile, getUserById } from '../../service/userService';
import { getPostsByUserId } from '../../service/postService';
import './ProfilePage.scss';
import UserPostFeed from '../../components/UserPostFeed/UserPostFeed';
import EditProfileModal from '../../components/EditProfileModal/EditProfileModal';
import ChangePasswordPopup from '../../components/ChangePasswordPopup/ChangePasswordPopup';

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
    const [followLoading, setFollowLoading] = useState(false);

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

                    if (profileRes.user.followers?.includes(meRes._id)) {
                        setIsFollowing(true);
                    } else {
                        setIsFollowing(false);
                    }

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

    const handleFollowToggle = async () => {
        if (followLoading) return;
        setFollowLoading(true);
        const originalFollowState = isFollowing;
        const originalProfileUser = { ...profileUser };

        setIsFollowing(!originalFollowState);
        setProfileUser(prev => ({
            ...prev,
            followers: originalFollowState
                ? prev.followers.filter(id => id !== currentUser._id)
                : [...prev.followers, currentUser._id]
        }));

        try {
            const res = await followUser(profileUser._id);
            if (res.success) {
                message.success(res.message);
            } else {
                setIsFollowing(originalFollowState);
                setProfileUser(originalProfileUser);
                message.error(res.error || "Thao tác thất bại.");
            }
        } catch (error) {
            setIsFollowing(originalFollowState);
            setProfileUser(originalProfileUser);
            message.error("Đã xảy ra lỗi.");
        } finally {
            setFollowLoading(false);
        }
    };

    if (loading) {
        return <div className="profile-loading"><Spin size="large" /></div>;
    }
    if (!profileUser) {
        return <div className="profile-loading"><h2>Không tìm thấy người dùng</h2></div>;
    }

    return (
        <div className="profile-page">
            <div className="profile-container">
                <div className="profile-header">
                    <div className="profile-info">
                        <img
                            src={profileUser.pfp || 'https://www.svgrepo.com/show/452030/avatar-default.svg'}
                            alt="Avatar"
                            className="avatar-img"
                        />
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
                                    className={`profile-btn ${isFollowing ? 'unfollow-btn' : 'follow-btn'}`}
                                    icon={isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
                                    onClick={handleFollowToggle}
                                    loading={followLoading}
                                >
                                    {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                                </Button>
                                <Button className="profile-btn" icon={<MessageCircle size={16} />}>
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