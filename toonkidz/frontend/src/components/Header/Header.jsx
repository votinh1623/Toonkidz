import React from "react";
import "./Header.scss";
import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faUser, faBars } from "@fortawesome/free-solid-svg-icons";
import { NavLink, useNavigate } from "react-router-dom";

const Header = ({ onToggleSider }) => {
  const navigate = useNavigate();
  return (
    <div className="container__header">
      <div className="header">
        {/* Hamburger icon */}
        <div className="header__menu-toggle" onClick={onToggleSider}>
          <FontAwesomeIcon icon={faBars} />
        </div>

        <div className="header__logo">Toon Kidz</div>

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
                to="/library"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Thư viện
              </NavLink>
            </li>
          </ul>
        </div>

        <div className="header__account">
          <FontAwesomeIcon icon={faBell} />
          <FontAwesomeIcon icon={faUser} />
        </div>

        <div className="header__button">
          <NavLink
                to="/home/create-comic" 
                className={({ isActive }) => (isActive ? "active" : "")}
              ><button>Tạo truyện</button>
              </NavLink>
            
        </div>
      </div>
    </div>
  );
};

export default Header;