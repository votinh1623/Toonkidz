import React, { useState } from "react";
import { Table, Tag, Input, Space, Tooltip } from "antd";
import { EyeOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import "./StoryManagement.scss";
import { useNavigate } from "react-router-dom";

const StoryManagement = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const stories = [
    {
      _id: "1",
      title: "Cuộc phiêu lưu trong rừng cổ tích",
      theme: "fairytale",
      author: "Admin",
      status: "Đã xuất bản",
      createdAt: "2025-06-10",
      views: 1342,
      pages: [
        { content: "Trang 1: Giới thiệu thế giới cổ tích...", img: "/images/page1.png", audio: "/audio/1.mp3" },
        { content: "Trang 2: Nhân vật chính xuất hiện...", img: "/images/page2.png" },
      ],
    },
    {
      _id: "2",
      title: "Khám phá hành tinh xanh",
      theme: "science",
      author: "Kiểm duyệt viên",
      status: "Bản nháp",
      createdAt: "2025-07-22",
      views: 768,
      pages: [],
    },
    {
      _id: "3",
      title: "Câu chuyện về những chú mèo",
      theme: "animal",
      author: "Admin",
      status: "Đã lưu trữ",
      createdAt: "2025-04-30",
      views: 232,
      pages: [],
    },
  ];

  const columns = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Thể loại",
      dataIndex: "theme",
      key: "theme",
      render: (theme) => (
        <Tag color="blue" style={{ textTransform: "capitalize" }}>
          {theme}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
    },
    {
      title: "Tác giả",
      dataIndex: "author",
      key: "author",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color = "default";
        if (status === "Đã xuất bản") color = "green";
        else if (status === "Bản nháp") color = "gold";
        else if (status === "Đã lưu trữ") color = "gray";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Lượt đọc",
      dataIndex: "views",
      key: "views",
    },
    {
      title: "Thao tác",
      key: "actions",
      render: () => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <button className="action-btn view">
              <EyeOutlined />
            </button>
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <button className="action-btn edit">
              <EditOutlined />
            </button>
          </Tooltip>
          <Tooltip title="Xoá">
            <button className="action-btn delete">
              <DeleteOutlined />
            </button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const filteredStories = stories.filter((story) =>
    story.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="story-management">
      <div className="story-management__header">
        <h2>Quản lý truyện</h2>
        <div className="story-management__actions">
          <Input.Search
            placeholder="Tìm kiếm truyện..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 250 }}
          />
          <button className="btn-add" onClick={() => navigate("/admin/stories-management/add")}>
            <PlusOutlined /> Thêm mới
          </button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={filteredStories}
        rowKey="_id"
        pagination={{ pageSize: 5 }}
        className="story-management__table"
      />
    </div>
  );
};

export default StoryManagement;