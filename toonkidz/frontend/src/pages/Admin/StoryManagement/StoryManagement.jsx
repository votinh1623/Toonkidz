// src/pages/Admin/StoryManagement/StoryManagement.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Table, Tag, Input, Space, Tooltip, Modal, message, Button, Select } from "antd";
import { EyeOutlined, EditOutlined, DeleteOutlined, PlusOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getStories, deleteStoryById } from "../../../service/storyService";
import { useDebounce } from "../../../hooks/useDebounce";
import StoryDetailModal from "../../../components/StoryDetailModal/StoryDetailModal";
import "./StoryManagement.scss";
import Swal from 'sweetalert2/dist/sweetalert2.js'
import 'sweetalert2/src/sweetalert2.scss'

const statusMap = {
  published: { text: "Đã xuất bản", color: "green" },
  draft: { text: "Bản nháp", color: "gold" },
  generated: { text: "AI đã tạo", color: "cyan" },
  generating: { text: "Đang tạo...", color: "blue" },
};

const themeOptions = [
  { value: "fairytale", label: "Cổ tích" },
  { value: "adventure", label: "Phiêu lưu" },
  { value: "animal", label: "Động vật" },
  { value: "science", label: "Khoa học" },
  { value: "music", label: "Âm nhạc" },
  { value: "nature", label: "Thiên nhiên" },
];

const statusOptions = [
  { value: "published", label: "Đã xuất bản" },
  { value: "draft", label: "Bản nháp" },
  { value: "generated", label: "AI đã tạo" },
];

const StoryManagement = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 5, total: 0 });

  const [filters, setFilters] = useState({
    search: "",
    status: null,
    theme: null,
  });

  const debouncedSearch = useDebounce(filters.search, 500);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);

  const fetchStories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStories(
        pagination.current,
        pagination.pageSize,
        debouncedSearch,
        filters.status,
        filters.theme
      );
      if (res.success) {
        setStories(res.stories);
        setPagination(prev => ({
          ...prev,
          total: res.pagination.totalStories,
        }));
      } else {
        message.error(res.error || "Không thể tải danh sách truyện!");
      }
    } catch (error) {
      message.error("Đã xảy ra lỗi khi tải dữ liệu!");
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, debouncedSearch, filters.status, filters.theme]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);


  const handleFilterChange = (filterName, value) => {
    setPagination(p => ({ ...p, current: 1 }));
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const handleDelete = (storyId, title) => {
    Swal.fire({
      title: `Bạn có chắc chắn muốn xóa?`,
      html: `Bạn sẽ không thể hoàn tác hành động này đối với truyện:<br><strong>${title}</strong>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Vâng, xóa nó!",
      cancelButtonText: "Hủy"
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Đang xóa...',
          html: `Vui lòng chờ trong khi truyện <strong>${title}</strong> được xóa.`,
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        try {
          const res = await deleteStoryById(storyId);
          if (res.success) {
            Swal.fire({
              title: "Đã xóa!",
              text: `Truyện "${title}" đã được xóa thành công.`,
              icon: "success",
              timer: 1500,
              showConfirmButton: false,
            });

            if (stories.length === 1 && pagination.current > 1) {
              setPagination(p => ({ ...p, current: p.current - 1 }));
            } else {
              fetchStories();
            }
          } else {
            Swal.fire("Lỗi!", res.error || "Xóa truyện thất bại.", "error");
          }
        } catch (error) {
          Swal.fire("Lỗi!", "Đã xảy ra lỗi khi kết nối đến server.", "error");
        }
      }
    });
  };

  const handleViewStory = (story) => {
    setSelectedStory(story);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => setIsModalOpen(false);

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
      width: 120,
      render: (theme) => (
        <Tag color="geekblue" style={{ textTransform: "capitalize" }}>
          {theme}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Tác giả",
      dataIndex: "userId",
      key: "author",
      width: 150,
      render: (user) => user?.name || 'Không xác định',
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status) => {
        const statusInfo = statusMap[status] || { text: status, color: "default" };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      fixed: 'right',
      width: 120,
      render: (text, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            {/* ✅ FIX: Bọc Button bằng <span> */}
            <span>
              <Button className="action-btn view" icon={<EyeOutlined />} onClick={() => handleViewStory(record)} />
            </span>
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <span>
              <Button className="action-btn edit" icon={<EditOutlined />} onClick={() => navigate(`/admin/stories-management/edit/${record._id}`)} />
            </span>
          </Tooltip>
          <Tooltip title="Xoá">
            <span>
              <Button className="action-btn delete" icon={<DeleteOutlined />} onClick={() => handleDelete(record._id, record.title)} />
            </span>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="story-management">
      <div className="story-management__header">
        <h2>Quản lý truyện</h2>
        <div className="story-management__actions">
          <Select
            className="filter-select"
            placeholder="Lọc theo trạng thái"
            onChange={(value) => handleFilterChange('status', value || null)}
            allowClear
            options={statusOptions}
            value={filters.status}
          />
          <Select
            className="filter-select"
            placeholder="Lọc theo thể loại"
            onChange={(value) => handleFilterChange('theme', value || null)}
            allowClear
            options={themeOptions}
            value={filters.theme}
          />
          <Input.Search
            placeholder="Tìm kiếm theo tiêu đề..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            onSearch={() => setPagination(p => ({ ...p, current: 1 }))}
            style={{ width: 250 }}
            enterButton
          />
          <Button className="btn-add" onClick={() => navigate("/admin/stories-management/add")}>
            <PlusOutlined /> Thêm mới
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={stories}
        rowKey="_id"
        pagination={pagination}
        loading={loading}
        onChange={(p) => setPagination(prev => ({ ...prev, current: p.current, pageSize: p.pageSize }))}
        className="story-management__table"
      />

      <StoryDetailModal
        story={selectedStory}
        open={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default StoryManagement;