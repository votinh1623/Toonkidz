// src/components/Header/Header.jsx

import React from "react";
import "./Header.scss";
import { Input, Dropdown, Space } from "antd";
import { LogoutOutlined, SearchOutlined } from "@ant-design/icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faBars } from "@fortawesome/free-solid-svg-icons";
import { NavLink, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { logout } from "@/service/authService";
import Notify from "../Notify/Notify";

const Header = ({ onToggleSider }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    Swal.fire({
      title: "Đăng xuất?",
      text: "Bạn có chắc muốn đăng xuất?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Đăng xuất",
      cancelButtonText: "Huỷ",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await logout();
          // Clear cookies (if backend doesn't set httpOnly)
          document.cookie = "accessToken=; Max-Age=0; path=/;";
          document.cookie = "refreshToken=; Max-Age=0; path=/;";

          Swal.fire({
            title: "Đã đăng xuất!",
            icon: "success",
            timer: 1200,
            showConfirmButton: false,
          });
          navigate("/login");
        } catch (err) {
          Swal.fire("Lỗi!", "Không thể đăng xuất. Thử lại sau!", "error");
        }
      }
    });
  };

  const items = [
    {
      key: "1",
      label: "Tài khoản",
      disabled: true,
    },
    { type: "divider" },
    {
      key: "2",
      label: "Hồ sơ",
      onClick: () => navigate("/home/profile"),
    },
    {
      key: "3",
      label: "Đăng xuất",
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  return (
    <div className="container__header">
      <div className="header">
        <div className="header__menu-toggle" onClick={onToggleSider}>
          <FontAwesomeIcon icon={faBars} />
        </div>

        <div
          className="header__logo"
          onClick={() => navigate("/home/homepage")}
          role="button"
          tabIndex={0}
        >
          Toon Kidz
        </div>

        <div className="header__search">
          <Input
            placeholder="Tìm kiếm truyện"
            prefix={<SearchOutlined style={{ color: "#aaa" }} />}
          />
        </div>

        <div className="header__menu">
          <ul>
            <li>
              <NavLink
                to="/home/homepage"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Trang chủ
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/discover"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Khám phá
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/home/learn-english"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Học Tiếng Anh
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/home/library"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Thư viện
              </NavLink>
            </li>
          </ul>
        </div>

        <div className="header__account">
          <Notify />
          <Dropdown menu={{ items }} trigger={["click"]}>
            <a onClick={(e) => e.preventDefault()}>
              <Space>
                <FontAwesomeIcon icon={faUser} />
              </Space>
            </a>
          </Dropdown>
        </div>

        <div className="header__button">
          <NavLink to="/home/create-comic">
            <button>Tạo truyện</button>
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default Header;
