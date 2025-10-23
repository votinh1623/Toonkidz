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
import { NavLink, useNavigate } from "react-router-dom";
import "./SiderContent.scss";

const NavItem = ({ to, icon, label, badge, onClose }) => {
  const handleNavigate = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <NavLink
      to={to}
      onClick={handleNavigate}
      className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
    >
      {icon}
      <span className="label">{label}</span>
      {badge && <span className="badge">{badge}</span>}
    </NavLink>
  );
};

const getInitials = (name) => {
  if (!name) return "?";
  const words = name.split(' ');
  if (words.length > 1) {
    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const SiderContent = ({ onClose, user }) => {
  const navigate = useNavigate();

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
          to="/home/chat"
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
        {user && user.pfp ? (
          <img src={user.pfp} alt="Avatar" className="avatar-img" />
        ) : (
          <div className="avatar-initials">
            {getInitials(user?.name)}
          </div>
        )}
        <div className="profile-info">
          <p className="name">{user ? user.name : "..."}</p>
          <p className="email">{user ? user.email : "..."}</p>
        </div>
      </div>
    </aside>
  );
};

export default SiderContent;