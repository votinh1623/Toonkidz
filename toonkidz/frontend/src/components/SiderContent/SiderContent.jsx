// src/components/SiderContent/SiderContent.jsx

import React from "react";
import {
  Home,
  Library,
  Compass,
  Heart,
  MessageCircle,
  User,
  Settings,
  Sparkles,
  Bell,
} from "lucide-react";
// ✅ 1. Import NavLink thay cho useNavigate
import { NavLink, useNavigate } from "react-router-dom";
import "./SiderContent.scss";

// ✅ 2. Biến NavItem thành NavLink
// Component này sẽ nhận prop `to` thay vì `onClick`
const NavItem = ({ to, icon, label, badge, onClose }) => {
  const handleNavigate = () => {
    // Tự động đóng Drawer (menu mobile) khi nhấn
    if (onClose) {
      onClose();
    }
  };

  return (
    <NavLink
      to={to}
      onClick={handleNavigate}
      // NavLink tự động thêm class "active" khi URL khớp
      className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
    >
      {icon}
      <span className="label">{label}</span>
      {badge && <span className="badge">{badge}</span>}
    </NavLink>
  );
};

const SiderContent = ({ onClose }) => {
  const navigate = useNavigate();

  // Hàm này chỉ dùng cho các nút không phải NavLink (như nút Tạo truyện)
  const handleNavigate = (path) => {
    navigate(path);
    if (onClose) {
      onClose();
    }
  };

  return (
    <aside className="sider">
      <nav className="sider__nav">
        <button
          className="create-btn"
          onClick={() => handleNavigate("/home/create-comic")}
        >
          <Sparkles className="icon" />
          <span>Tạo truyện AI</span>
        </button>

        {/* ✅ 3. Sử dụng NavItem (giờ là NavLink) với prop `to` và `onClose` */}
        <NavItem
          to="/home/homepage"
          icon={<Home className="icon" />}
          label="Trang chủ"
          onClose={onClose}
        />
        <NavItem
          to="/home/library"
          icon={<Library className="icon" />}
          label="Thư viện của tôi"
          onClose={onClose}
        />
        <NavItem
          to="/discover"
          icon={<Compass className="icon" />}
          label="Khám phá"
          onClose={onClose}
        />

        <NavItem
          to="/home/library-favorites"
          icon={<Heart className="icon" />}
          label="Truyện sẵn có"
          onClose={onClose}
        />

        <NavItem
          to="/home/messages"
          icon={<MessageCircle className="icon" />}
          label="Tin nhắn"
          badge="3"
          onClose={onClose}
        />
        <NavItem
          to="/home/notifications"
          icon={<Bell className="icon" />}
          label="Thông báo"
          badge="5"
          onClose={onClose}
        />

        <div className="divider"></div>

        <NavItem
          to="/home/profile"
          icon={<User className="icon" />}
          label="Tài khoản"
          onClose={onClose}
        />
        <NavItem
          to="/home/settings"
          icon={<Settings className="icon" />}
          label="Cài đặt"
          onClose={onClose}
        />
      </nav>

      <div className="sider__profile" onClick={() => handleNavigate("/home/profile")}>
        <div className="avatar">PH</div>
        <div className="profile-info">
          <p className="name">Phụ huynh</p>
          <p className="email">parent@email.com</p>
        </div>
      </div>
    </aside>
  );
};

export default SiderContent;