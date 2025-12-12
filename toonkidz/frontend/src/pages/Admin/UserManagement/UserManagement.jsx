import React, { useState, useEffect, useCallback } from "react";
import { Table, Tag, Space, Tooltip, Modal, message, Form, Select, Switch, Button, Input } from "antd";
import { EditOutlined, DeleteOutlined, SearchOutlined } from "@ant-design/icons";
import { getAllUsers, adminUpdateUser, adminDeactivateUser } from "../../../service/userService";
import { useDebounce } from "../../../hooks/useDebounce";
import Swal from 'sweetalert2/dist/sweetalert2.js';
import 'sweetalert2/src/sweetalert2.scss';
import "./UserManagement.scss";

const { Option } = Select;

const roleMap = {
  admin: { text: "Admin", color: "red" },
  user: { text: "User", color: "blue" },
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 5, total: 0 });
  const [filters, setFilters] = useState({ search: "", role: null });
  const debouncedSearch = useDebounce(filters.search, 500);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm] = Form.useForm();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllUsers(
        pagination.current,
        pagination.pageSize,
        debouncedSearch,
        filters.role
      );
      if (res.success) {
        setUsers(res.users);
        setPagination(prev => ({
          ...prev,
          total: res.pagination.totalUsers,
        }));
      } else {
        message.error(res.error || "Không thể tải danh sách người dùng!");
      }
    } catch (error) {
      message.error("Đã xảy ra lỗi khi tải dữ liệu!");
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, debouncedSearch, filters.role]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFilterChange = (filterName, value) => {
    setPagination(p => ({ ...p, current: 1 }));
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const handleDelete = (userId, name) => {
    Swal.fire({
      title: `Vô hiệu hóa tài khoản?`,
      html: `Bạn sẽ **khóa quyền truy cập** của người dùng này:<br><strong>${name}</strong>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Vâng, Vô hiệu hóa!",
      cancelButtonText: "Hủy"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await adminDeactivateUser(userId);
          if (res.success) {
            Swal.fire("Đã vô hiệu hóa!", res.message || "Tài khoản đã bị khóa thành công.", "success");
            fetchUsers();
          } else {
            Swal.fire("Lỗi!", res.error || "Vô hiệu hóa thất bại.", "error");
          }
        } catch (error) {
          Swal.fire("Lỗi!", "Đã xảy ra lỗi kết nối.", "error");
        }
      }
    });
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    editForm.setFieldsValue({
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });
    setIsModalOpen(true);
  };

  const handleUpdate = async () => {
    try {
      const values = await editForm.validateFields();
      const res = await adminUpdateUser(editingUser._id, values);
      if (res.success) {
        message.success("Cập nhật thành công!");
        setIsModalOpen(false);
        fetchUsers();
      } else {
        message.error(res.error || "Cập nhật thất bại.");
      }
    } catch (error) {
      message.error("Lỗi cập nhật. Vui lòng thử lại.");
    }
  };

  const columns = [
    {
      title: "Tên người dùng",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Space>
          <img src={record.pfp || 'https://www.svgrepo.com/show/452030/avatar-default.svg'} alt="pfp" className="user-avatar-sm" />
          <strong>{text}</strong>
        </Space>
      )
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Quyền",
      dataIndex: "role",
      key: "role",
      width: 100,
      render: (role) => {
        const roleInfo = roleMap[role] || { text: role, color: "default" };
        return <Tag color={roleInfo.color}>{roleInfo.text}</Tag>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 100,
      render: (isActive) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Hoạt động" : "Bị khóa"}
        </Tag>
      ),
    },
    {
      title: "Ngày tham gia",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Thao tác",
      key: "actions",
      fixed: 'right',
      width: 100,
      render: (text, record) => (
        <Space>
          <Tooltip title="Chỉnh sửa">
            <Button className="action-btn edit" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Tooltip title="Xoá">
            <Button className="action-btn delete" icon={<DeleteOutlined />} onClick={() => handleDelete(record._id, record.name)} disabled={!record.isActive} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="user-management">
      <div className="user-management__header">
        <h2>Quản lý người dùng</h2>
        <div className="user-management__actions">
          <div className="search-wrapper">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email..."
              className="search-input"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  setPagination(p => ({ ...p, current: 1 }));
                }
              }}
            />
            <SearchOutlined className="search-icon" />
          </div>
          <Select
            className="filter-select"
            placeholder="Lọc theo quyền"
            onChange={(value) => handleFilterChange('role', value || null)}
            allowClear
            options={Object.keys(roleMap).map(key => ({ value: key, label: roleMap[key].text }))}
            value={filters.role}
          />
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="_id"
        pagination={pagination}
        loading={loading}
        onChange={(p) => setPagination(prev => ({ ...prev, current: p.current, pageSize: p.pageSize }))}
        className="user-management__table"
      />

      <Modal
        title="Chỉnh sửa thông tin người dùng"
        open={isModalOpen}
        onOk={handleUpdate}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu thay đổi"
        cancelText="Hủy"
      >
        <Form form={editForm} layout="vertical" initialValues={editingUser}>
          <Form.Item label="Họ tên" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Quyền" name="role">
            <Select>
              <Option value="user">User</Option>
              <Option value="admin">Admin</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Trạng thái" name="isActive" valuePropName="checked">
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Bị khóa" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;