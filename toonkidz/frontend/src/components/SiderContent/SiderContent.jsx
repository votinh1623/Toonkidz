import React from "react";
import "./SiderContent.scss";
import {
  StarFilled,
  CompassFilled,
  ExperimentFilled,
  CustomerServiceFilled,
  HeartFilled,
  FireFilled,
  CheckCircleFilled,
  ClockCircleFilled
} from "@ant-design/icons";
import { FaTree, FaPaw, FaMusic, FaBook } from "react-icons/fa6";

const SiderContent = () => {
  return (
    <div className="sider-content">
      {/* Thể loại */}
      <div className="sider-section">
        <h3 className="sider-title">Thể loại truyện</h3>
        <ul className="sider-list">
          <li><StarFilled className="icon star" /> Cổ tích</li>
          <li><CompassFilled className="icon adventure" /> Phiêu lưu</li>
          <li><FaPaw className="icon animal" /> Động vật</li>
          <li><ExperimentFilled className="icon science" /> Khoa học</li>
          <li><FaTree className="icon nature" /> Thiên nhiên</li>
          <li><FaMusic className="icon music" /> Âm nhạc</li>
        </ul>
      </div>

      {/* Danh sách đặc biệt */}
      <div className="sider-section">
        <h3 className="sider-title">Danh sách đặc biệt</h3>
        <ul className="sider-list">
          <li><StarFilled className="icon star" /> Truyện nổi bật</li>
          <li><ClockCircleFilled className="icon new" /> Mới cập nhật</li>
          <li><CheckCircleFilled className="icon done" /> Hoàn thành</li>
          <li><FireFilled className="icon hot" /> Đang hot</li>
          <li><HeartFilled className="icon heart" /> Yêu thích nhất</li>
        </ul>
      </div>
    </div>
  );
};

export default SiderContent;