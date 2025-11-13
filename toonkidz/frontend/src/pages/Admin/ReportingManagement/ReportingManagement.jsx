// src/pages/Admin/ReportingManagement/ReportingManagement.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Table, Tag, Input, Space, Tooltip, Modal, message, Button, Select, Dropdown, Menu } from "antd";
import { EyeOutlined, CheckCircleOutlined, StopOutlined, ClockCircleOutlined, DownOutlined, DeleteOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getAllReports, updateReportStatus, adminDeleteComment } from "../../../service/reportService";
import ReportDetailModal from "../../../components/ReportDetailModal/ReportDetailModal";
import "./ReportingManagement.scss";
import Swal from 'sweetalert2';

const { Option } = Select;

const statusMap = {
  pending: { text: "Chờ xử lý", color: "orange" },
  reviewed: { text: "Đang xem xét", color: "blue" },
  resolved: { text: "Đã giải quyết", color: "green" },
  rejected: { text: "Đã từ chối", color: "red" },
};

const statusOptions = [
  { value: "pending", label: "Chờ xử lý" },
  { value: "reviewed", label: "Đang xem xét" },
  { value: "resolved", label: "Đã giải quyết" },
  { value: "rejected", label: "Đã từ chối" },
];

const typeMap = {
  Post: { text: "Bài viết", color: "cyan" },
  Comment: { text: "Bình luận", color: "purple" },
  User: { text: "Người dùng", color: "magenta" },
};

const typeOptions = [
  { value: "Post", label: "Bài viết" },
  { value: "Comment", label: "Bình luận" },
  { value: "User", label: "Người dùng" },
];


const ReportingManagement = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 5, total: 0 });

  const [filters, setFilters] = useState({
    status: "pending",
    targetType: null,
  });

  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllReports(
        filters.status,
        filters.targetType,
        pagination.current,
        pagination.pageSize,
      );
      if (res.success) {
        console.log(res.reports);
        setReports(res.reports);
        setPagination(prev => ({
          ...prev,
          total: res.total,
        }));
      } else {
        message.error(res.error || "Không thể tải danh sách báo cáo!");
      }
    } catch (error) {
      message.error("Đã xảy ra lỗi khi tải dữ liệu!");
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, filters.status, filters.targetType]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);


  const handleFilterChange = (filterName, value) => {
    setPagination(p => ({ ...p, current: 1 }));
    setFilters(prev => ({ ...prev, [filterName]: value || null }));
  };

  const handleUpdateStatus = async (reportId, newStatus) => {
    try {
      const res = await updateReportStatus(reportId, newStatus);
      if (res.success) {
        message.success("Cập nhật trạng thái thành công!");
        // Tải lại danh sách lọc hiện tại
        fetchReports();
      } else {
        message.error(res.error || "Cập nhật thất bại.");
      }
    } catch (error) {
      message.error("Lỗi máy chủ.");
    }
  };

  const handleQuickDeleteComment = (report) => {
    const { targetId, targetDetail } = report;

    if (!targetDetail || !targetDetail.postId) {
      message.error("Lỗi: Không tìm thấy Post ID của bình luận này.");
      return;
    }

    Swal.fire({
      title: `Xóa bình luận này?`,
      html: `Bạn có chắc muốn xóa bình luận: <br><i>"${targetDetail.commentText}"</i><br> Hành động này sẽ giải quyết báo cáo này.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Vâng, xóa nó!",
      cancelButtonText: "Hủy"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const deleteRes = await adminDeleteComment(targetDetail.postId, targetId);
          if (deleteRes.success) {
            message.success("Đã xóa bình luận.");
            handleUpdateStatus(report._id, 'resolved');
          } else {
            message.error(deleteRes.error || "Xóa thất bại.");
          }
        } catch (err) {
          message.error("Lỗi kết nối khi xóa.");
        }
      }
    });
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => setIsModalOpen(false);

  const getTargetContent = (report) => {
    const { targetType, targetDetail } = report;
    if (!targetDetail) return <Tag color="gray">Nội dung đã bị xóa</Tag>;

    switch (targetType) {
      case 'Post':
        return `Truyện: ${targetDetail.storyId?.title || 'N/A'}`;
      case 'Comment':
        return `"${targetDetail.commentText}"`;
      case 'User':
        return `Người dùng: ${targetDetail.name}`;
      default:
        return 'N/A';
    }
  };

  const ActionMenu = ({ record }) => (
    <Menu onClick={({ key }) => handleUpdateStatus(record._id, key)}>
      <Menu.Item key="reviewed" icon={<ClockCircleOutlined />}>
        Đánh dấu là "Đang xem xét"
      </Menu.Item>
      <Menu.Item key="resolved" icon={<CheckCircleOutlined />}>
        Đánh dấu là "Đã giải quyết"
      </Menu.Item>
      <Menu.Item key="rejected" danger icon={<StopOutlined />}>
        Đánh dấu là "Từ chối"
      </Menu.Item>
    </Menu>
  );

  const columns = [
    {
      title: "Người báo cáo",
      dataIndex: "reporterId",
      key: "reporter",
      render: (reporter) => (
        <span
          onClick={() => reporter?._id && navigate(`/home/profile/${reporter._id}`)}
          style={{ cursor: 'pointer', color: '#1890ff' }}
        >
          {reporter?.name || 'Không xác định'}
        </span>
      ),
    },
    {
      title: "Loại đối tượng",
      dataIndex: "targetType",
      key: "targetType",
      width: 120,
      render: (type) => {
        const typeInfo = typeMap[type] || { text: type, color: "default" };
        return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
      },
    },
    {
      title: "Chi tiết",
      key: "detail",
      render: (record) => (
        <Tooltip title={getTargetContent(record)}>
          <span className="report-detail-snippet">{getTargetContent(record)}</span>
        </Tooltip>
      )
    },
    {
      title: "Lý do",
      dataIndex: "reason",
      key: "reason",
      width: 150,
    },
    {
      title: "Ngày báo cáo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
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
      width: 150,
      render: (text, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <span>
              <Button className="action-btn view" icon={<EyeOutlined />} onClick={() => handleViewReport(record)} />
            </span>
          </Tooltip>
          <Dropdown overlay={<ActionMenu record={record} />}>
            <Button className="action-btn edit">
              Cập nhật <DownOutlined />
            </Button>
          </Dropdown>
          {record.targetType === 'Comment' && (
            <Tooltip title="Xóa nhanh bình luận">
              <span>
                <Button
                  className="action-btn delete"
                  icon={<DeleteOutlined />}
                  onClick={() => handleQuickDeleteComment(record)}
                />
              </span>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="report-management">
      <div className="report-management__header">
        <h2>Quản lý Báo cáo</h2>
        <div className="report-management__actions">
          <Select
            className="filter-select"
            placeholder="Lọc theo trạng thái"
            onChange={(value) => handleFilterChange('status', value)}
            allowClear
            options={statusOptions}
            value={filters.status}
          />
          <Select
            className="filter-select"
            placeholder="Lọc theo loại"
            onChange={(value) => handleFilterChange('targetType', value)}
            allowClear
            options={typeOptions}
            value={filters.targetType}
          />
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={reports}
        rowKey="_id"
        pagination={pagination}
        loading={loading}
        onChange={(p) => setPagination(prev => ({ ...prev, current: p.current, pageSize: p.pageSize }))}
        className="report-management__table"
      />

      <ReportDetailModal
        report={selectedReport}
        open={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default ReportingManagement;