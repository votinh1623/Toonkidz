import React from "react";
import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import "./SiderMobileMenu.scss";

const SiderMobileMenu = ({ onClose }) => {
  return (
    <div className="sider-mobile-menu">
      <Input
        className="search-input"
        placeholder="Tìm kiếm truyện"
        prefix={<SearchOutlined style={{ color: "#aaa" }} />}
      />
      <ul>
        <li onClick={onClose}>Trang chủ</li>
        <li onClick={onClose}>Khám phá</li>
        <li onClick={onClose}>Thư viện</li>
      </ul>
    </div>
  );
};

export default SiderMobileMenu;