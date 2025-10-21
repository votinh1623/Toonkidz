import React, { useState } from "react";
import { User, Search } from "lucide-react";
import { useNavigate, NavLink } from "react-router-dom";
import { toast } from "sonner";
import { logout } from "../../service/authService";
import Notify from "../Notify/Notify";
import "./Header.scss";

const Header = ({ onToggleSider }) => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    if (window.confirm("Bạn có chắc muốn đăng xuất?")) {
      try {
        await logout();
        document.cookie = "accessToken=; Max-Age=0; path=/;";
        document.cookie = "refreshToken=; Max-Age=0; path=/;";
        toast.success("Đã đăng xuất!");
        navigate("/login");
      } catch (err) {
        toast.error("Không thể đăng xuất. Thử lại sau!");
      }
    }
  };

  return (
    <header className="header-container">
      <div className="header">
        <button className="header__toggle" onClick={onToggleSider}>
          <svg
            className="icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <div
          className="header__logo"
          onClick={() => navigate("/home/homepage")}
        >
          TOON KIDZ
        </div>

        <div className="header__search">
          <input type="text" placeholder="Tìm kiếm truyện..." />
          <Search className="search-icon" />
        </div>

        <nav className="header__nav">
          <NavLink to="/home/homepage">Trang chủ</NavLink>
          <NavLink to="/discover">Khám phá</NavLink>
          <NavLink to="/home/learn-english">Học Tiếng Anh</NavLink>
          <NavLink to="/home/library">Thư viện</NavLink>
        </nav>

        <div className="header__actions">
          <Notify />

          <div className="header__account">
            <button
              className="account-btn"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <User className="account-icon" />
            </button>

            {showDropdown && (
              <div className="account-dropdown">
                <div className="account-dropdown__title">Tài khoản</div>
                <button
                  onClick={() => {
                    navigate("/home/profile");
                    setShowDropdown(false);
                  }}
                >
                  Hồ sơ
                </button>
                <button onClick={handleLogout}>Đăng xuất</button>
              </div>
            )}
          </div>

          <NavLink to="/home/create-comic" className="header__create-btn">
            Tạo truyện
          </NavLink>
        </div>
      </div>
    </header>
  );
};

export default Header;
