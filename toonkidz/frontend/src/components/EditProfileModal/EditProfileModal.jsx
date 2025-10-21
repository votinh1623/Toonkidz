// src/pages/ProfilePage/EditProfileModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { updateProfile } from '../../service/userService';
import { getProvinces } from '../../service/locationService';

const { Option } = Select;

const EditProfileModal = ({ open, onClose, currentUser, onUpdate }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(currentUser?.pfp || null);

  useEffect(() => {
    if (open) {
      const fetchProvinces = async () => {
        try {
          const data = await getProvinces();
          setProvinces(data || []);
        } catch (err) {
          console.error("Failed to fetch provinces:", err);
          message.error("Không thể tải danh sách tỉnh thành");
        }
      };
      fetchProvinces();

      form.setFieldsValue({
        name: currentUser.name,
        address: currentUser.address,
        gender: currentUser.gender,
      });
      setAvatarPreview(currentUser.pfp || null);
      setAvatarFile(null);
    }
  }, [open, currentUser, form]);

  const handleUpdate = async (values) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('address', values.address || '');
      formData.append('gender', values.gender || '');

      if (avatarFile) {
        formData.append('pfp', avatarFile);
      }

      const res = await updateProfile(formData);
      if (res.success) {
        onUpdate(res.user);
      } else {
        message.error(res.error || "Cập nhật thất bại.");
      }
    } catch (error) {
      message.error("Đã xảy ra lỗi khi cập nhật.");
    } finally {
      setLoading(false);
    }
  };

  const beforeUpload = (file) => {
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    return false;
  };

  return (
    <Modal
      title="Cập nhật thông tin"
      open={open}
      onCancel={onClose}
      footer={null}
      className="popup-container"
      centered
    >
      <Form form={form} layout="vertical" onFinish={handleUpdate} className="popup-form">
        <Form.Item label="Ảnh đại diện">
          <div className="popup-avatar">
            <img
              src={avatarPreview || 'https://www.svgrepo.com/show/452030/avatar-default.svg'}
              alt="Avatar"
              className="avatar-preview"
            />
            <Upload beforeUpload={beforeUpload} showUploadList={false}>
              <Button icon={<UploadOutlined />}>Thay đổi</Button>
            </Upload>
          </div>
        </Form.Item>
        <Form.Item label="Họ tên" name="name" rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Địa chỉ" name="address">
          <Select showSearch placeholder="Chọn tỉnh/thành phố" optionFilterProp="children" allowClear>
            {provinces.map(p => (
              <Option key={p.code} value={p.name}>
                {p.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="Giới tính" name="gender">
          <Select placeholder="Chọn giới tính" allowClear>
            <Option value="Nam">Nam</Option>
            <Option value="Nữ">Nữ</Option>
            <Option value="Khác">Khác</Option>
          </Select>
        </Form.Item>
        <Button className="popup-submit" type="primary" htmlType="submit" loading={loading} block>
          Lưu thay đổi
        </Button>
      </Form>
    </Modal>
  );
};

export default EditProfileModal;