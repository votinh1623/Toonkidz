import React from "react";
import { Input } from "antd";
import { LogoutOutlined, SearchOutlined } from "@ant-design/icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faUser, faBars } from "@fortawesome/free-solid-svg-icons";
import { NavLink, useNavigate } from "react-router-dom";
import { Dropdown, Space } from 'antd';
import Notify from '../Notify/Notify';
import './Header.scss';

const Header = ({ onToggleSider }) => {
  const navigate = useNavigate(); // Hook để điều hướng đến các trang

  // Dropdown menu items
  const items = [
    {
      key: '1',
      label: 'Tài khoản',
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: '2',
      label: 'Hồ sơ', // Mục "Hồ sơ"
      extra: <FontAwesomeIcon icon={faUser} />,
      onClick: () => navigate('/home/profile'), // Điều hướng đến trang ProfilePage
    },
    {
      key: '3',
      label: 'Đăng xuất',
      extra: <LogoutOutlined />,
      onClick: () => {
        // Logic đăng xuất (ví dụ: xóa session, token, v.v.)
        console.log('Logged out');
      },
    },
  ];

  return (
    <div className="container__header">
      <div className="header">
        {/* Hamburger icon */}
        <div className="header__menu-toggle" onClick={onToggleSider}>
          <FontAwesomeIcon icon={faBars} />
        </div>

        {/* Logo */}
        <div className="header__logo" onClick={() => navigate("/home/homepage")}>
          Toon Kidz
        </div>

        {/* Search input */}
        <div className="header__search">
          <Input
            placeholder="Tìm kiếm truyện"
            prefix={<SearchOutlined style={{ color: "#aaa" }} />}
          />
        </div>

        {/* Navigation links */}
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
            {/* Add "Học Tiếng Anh" tab */}
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

        {/* Account section */}
        <div className="header__account">
          {/* Notification */}
          <Notify />
          <Dropdown menu={{ items }}>
            <a onClick={(e) => e.preventDefault()}>
              <Space>
                <FontAwesomeIcon icon={faUser} />
              </Space>
            </a>
          </Dropdown>
        </div>

        {/* Button to create comic */}
        <div className="header__button">
          <NavLink
            to="/home/create-comic"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <button>Tạo truyện</button>
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default Header;
