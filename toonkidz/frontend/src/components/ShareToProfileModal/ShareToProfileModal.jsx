import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, message, Space } from 'antd';
import { GlobalOutlined, TeamOutlined, LockOutlined } from '@ant-design/icons';
import { sharePostToProfile } from '../../service/postService';
import "../UserPostFeed/UserPostFeed.scss";

const { Option } = Select;

const EmbeddedPost = ({ post }) => {
  const isShared = post.originalPostId;
  const originalPost = isShared ? post.originalPostId : post;

  if (!originalPost.userId || !originalPost.storyId) {
    return <div style={{ padding: 10, color: 'red' }}>Không thể tải bài viết gốc.</div>;
  }

  const author = originalPost.userId;
  const story = originalPost.storyId;

  return (
    <div className="embedded-post-container">
      <div className="author-info">
        {author.pfp ? (
          <img className="avatar" src={author.pfp} alt={author.name} />
        ) : (
          <div className="avatar-initials">{author.name[0]}</div>
        )}
        <div className="author-details">
          <h4>{author.name}</h4>
          <p>{new Date(originalPost.createdAt).toLocaleString('vi-VN')}</p>
        </div>
      </div>
      {originalPost.caption && <p className="story-caption">{originalPost.caption}</p>}
      <div className="story-meta">
        <p><strong>Truyện:</strong> {story.title}</p>
      </div>
    </div>
  );
};

const ShareToProfileModal = ({ open, onClose, post, onShared }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({ visibility: 'public' });
    }
  }, [open, form]);

  const handleFormSubmit = async (values) => {
    setLoading(true);
    try {
      const res = await sharePostToProfile(post._id, values);
      if (res.success) {
        message.success("Chia sẻ thành công!");
        onShared(res.post);
        onClose();
      } else {
        message.error(res.error || "Chia sẻ thất bại.");
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
      title="Chia sẻ bài viết lên tường của bạn"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="back" onClick={onClose}>
          Hủy
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={form.submit}>
          Đăng
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" onFinish={handleFormSubmit} initialValues={{ visibility: 'public' }}>
        <Form.Item name="caption">
          <Input.TextArea
            rows={3}
            placeholder="Nói gì đó về bài viết này..."
          />
        </Form.Item>

        {/* Hiển thị bài viết gốc (được nhúng) */}
        <EmbeddedPost post={post} />

        <Form.Item
          name="visibility"
          label="Quyền xem"
          rules={[{ required: true, message: 'Vui lòng chọn quyền xem!' }]}
          style={{ marginTop: 20 }}
        >
          <Select placeholder="Chọn quyền xem">
            <Option value="public">
              <Space><GlobalOutlined /> Công khai</Space>
            </Option>
            <Option value="friend">
              <Space><TeamOutlined /> Bạn bè</Space>
            </Option>
            <Option value="private">
              <Space><LockOutlined /> Chỉ mình tôi</Space>
            </Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ShareToProfileModal;