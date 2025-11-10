// src/components/PostEditModal/PostEditModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Input, Form, Select, Button, message } from 'antd';
import { updatePostApi } from '../../service/postService';

const { Option } = Select;

const PostEditModal = ({ open, onClose, post, onUpdate }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (post && open) {
      form.setFieldsValue({
        caption: post.caption || '',
        visibility: post.visibility || 'public',
      });
    }
  }, [post, open, form]);

  const handleFormSubmit = async (values) => {
    if (!post || post.status === 'deleted') return;
    setLoading(true);

    try {
      const res = await updatePostApi(post._id, values);

      if (res.success) {
        onUpdate(res.post);
        message.success("Bài viết đã được cập nhật!");
        onClose();
      } else {
        message.error(res.error || "Cập nhật thất bại.");
      }
    } catch (error) {
      message.error("Lỗi kết nối server.");
    } finally {
      setLoading(false);
    }
  };

  if (!post) return null;

  return (
    <Modal
      title={`Chỉnh sửa Bài viết của ${post.userId.name}`}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="back" onClick={onClose}>
          Hủy
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={form.submit}>
          Lưu Thay đổi
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
        <Form.Item
          name="caption"
          label="Nội dung Bài viết (Caption)"
        >
          <Input.TextArea rows={4} placeholder="Thêm mô tả cho bài viết..." />
        </Form.Item>

        <Form.Item
          name="visibility"
          label="Quyền xem"
          rules={[{ required: true, message: 'Vui lòng chọn quyền xem!' }]}
        >
          <Select placeholder="Chọn quyền xem">
            <Option value="public">Công khai (Public)</Option>
            <Option value="friend">Bạn bè (Friends Only)</Option>
            <Option value="private">Chỉ mình tôi (Private)</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PostEditModal;