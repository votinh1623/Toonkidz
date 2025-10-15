import { UserCircle2 } from 'lucide-react';
import { useState } from 'react';
import './ProfilePage.scss';

const ProfilePage = ({ onBack }) => {
    const [formData, setFormData] = useState({
        username: '',
        address: '',
        fullName: '',
        gender: '',
    });

    const [showEditPopup, setShowEditPopup] = useState(false);
    const [showPasswordPopup, setShowPasswordPopup] = useState(false);

    const [editData, setEditData] = useState({
        fullName: '',
        gender: '',
        address: '',
        email: '',
        avatar: null,
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const handleUpdate = () => {
        console.log('Cập nhật thông tin:', editData);
        setShowEditPopup(false);
    };

    const handlePasswordChange = () => {
        console.log('Đổi mật khẩu:', passwordData);
        setShowPasswordPopup(false);
    };

    return (
        <div className="profile-page">
            <div className="main-content">
                <h1 className="profile-title">Trang cá nhân</h1>

                <div className="profile-container">
                    {/* Header */}
                    <div className="profile-header">
                        <div className="profile-info">
                            <div className="avatar">
                                <UserCircle2 className="avatar-icon" />
                            </div>
                            <div>
                                <h2 className="username">Alexa Rawles</h2>
                                <div className="follower-info">
                                    <span>Người theo dõi: 10</span>
                                    <span>Đang theo dõi: 12</span>
                                </div>
                            </div>
                        </div>
                        <button className="edit-button" onClick={() => setShowEditPopup(true)}>
                            Chỉnh sửa
                        </button>
                    </div>

                    {/* Form hiển thị */}
                    <div className="form-grid">
                        <div>
                            <label className="label">Tên đăng nhập</label>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                className="form-input"
                            />
                        </div>

                        <div>
                            <label className="label">Địa chỉ</label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="form-input"
                            />
                        </div>

                        <div>
                            <label className="label">Họ tên</label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                className="form-input"
                            />
                        </div>

                        <div>
                            <label className="label">Giới tính</label>
                            <input
                                type="text"
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                className="form-input"
                            />
                        </div>
                    </div>

                    <div className="email-container">
                        <label className="label">Email của bạn:</label>
                        <p className="email">alexarawles@gmail.com</p>
                    </div>

                    <div className="change-password-container">
                        <button
                            className="change-password-button"
                            onClick={() => setShowPasswordPopup(true)}
                        >
                            Đổi mật khẩu
                        </button>
                    </div>
                </div>
            </div>

            {/* ================= POPUP CẬP NHẬT ================= */}
            {showEditPopup && (
                <div className="popup-overlay" onClick={() => setShowEditPopup(false)}>
                    <div className="popup-container" onClick={(e) => e.stopPropagation()}>
                        <h2>Cập nhật thông tin cá nhân</h2>
                        <div className="popup-form">
                            <div className="popup-row">
                                <div>
                                    <label>Họ tên:</label>
                                    <input
                                        type="text"
                                        value={editData.fullName}
                                        onChange={(e) =>
                                            setEditData({ ...editData, fullName: e.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <label>Địa chỉ:</label>
                                    <input
                                        type="text"
                                        value={editData.address}
                                        onChange={(e) =>
                                            setEditData({ ...editData, address: e.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="popup-row">
                                <div>
                                    <label>Giới tính:</label>
                                    <select
                                        value={editData.gender}
                                        onChange={(e) =>
                                            setEditData({ ...editData, gender: e.target.value })
                                        }
                                    >
                                        <option value="">Chọn giới tính</option>
                                        <option value="Nam">Nam</option>
                                        <option value="Nữ">Nữ</option>
                                    </select>
                                </div>
                                <div>
                                    <label>Email:</label>
                                    <input
                                        type="email"
                                        value={editData.email}
                                        onChange={(e) =>
                                            setEditData({ ...editData, email: e.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="popup-avatar">
                                <label>Ảnh đại diện:</label>
                                <div className="avatar-box">
                                    {editData.avatar ? (
                                        <img
                                            src={URL.createObjectURL(editData.avatar)}
                                            alt="Avatar"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                borderRadius: '10px',
                                                objectFit: 'cover',
                                            }}
                                        />
                                    ) : (
                                        <span>Thay đổi</span>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        setEditData({ ...editData, avatar: e.target.files[0] })
                                    }
                                    className="change-avatar"
                                />
                            </div>

                            <button className="popup-submit" onClick={handleUpdate}>
                                Cập nhật
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= POPUP ĐỔI MẬT KHẨU ================= */}
            {showPasswordPopup && (
                <div className="popup-overlay" onClick={() => setShowPasswordPopup(false)}>
                    <div className="popup-container password-popup" onClick={(e) => e.stopPropagation()}>
                        <h2>Đổi mật khẩu</h2>
                        <div className="popup-form">
                            <div>
                                <label>Mật khẩu</label>
                                <input
                                    type="password"
                                    className="password-input"
                                    placeholder="Nhập mật khẩu hiện tại"
                                    value={passwordData.currentPassword}
                                    onChange={(e) =>
                                        setPasswordData({
                                            ...passwordData,
                                            currentPassword: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <label>Mật khẩu mới</label>
                                <input
                                    type="password"
                                    className="password-input"
                                    placeholder="Nhập mật khẩu mới"
                                    value={passwordData.newPassword}
                                    onChange={(e) =>
                                        setPasswordData({
                                            ...passwordData,
                                            newPassword: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <label>Nhập lại mật khẩu mới</label>
                                <input
                                    type="password"
                                    className="password-input"
                                    placeholder="Nhập lại mật khẩu mới"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) =>
                                        setPasswordData({
                                            ...passwordData,
                                            confirmPassword: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <button className="password-submit" onClick={handlePasswordChange}>
                                Đổi mật khẩu
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ProfilePage;
