import React from "react";
import "./AdminSiderContent.scss";
import {
  DashboardFilled,
  TeamOutlined,
  FileTextFilled,
  BarChartOutlined,
  PieChartFilled,
  MessageOutlined,
} from "@ant-design/icons";
import { NavLink } from "react-router-dom";

const AdminSiderContent = () => {
  return (
    <div className="admin-sider-content">
      {/* Tổng quan */}
      <div className="sider-section">
        <h3 className="sider-title">Bảng điều khiển</h3>
        <ul className="sider-list">
          <li>
            <NavLink to="/admin/dashboard" className="sider-link">
              <DashboardFilled className="icon overview" /> Tổng quan
            </NavLink>
          </li>
        </ul>
      </div>

      {/* Quản lý */}
      <div className="sider-section">
        <h3 className="sider-title">Quản lý hệ thống</h3>
        <ul className="sider-list">
          <li>
            <NavLink to="/admin/users-management" className="sider-link">
              <TeamOutlined className="icon users" /> Quản lý người dùng
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/stories-management" className="sider-link">
              <FileTextFilled className="icon content" /> Quản lý nội dung
            </NavLink>
          </li>
        </ul>
      </div>

      <div className="sider-section">
        <h3 className="sider-title">Báo cáo & Hỗ trợ</h3>
        <ul className="sider-list">
          <li>
            <NavLink to="/admin/reports" className="sider-link">
              <BarChartOutlined className="icon statistic" /> Quản lý báo cáo
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/feedback" className="sider-link">
              <MessageOutlined className="icon feedback" /> Phản hồi & Hỗ trợ
            </NavLink>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AdminSiderContent;