import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Button, message } from 'antd';
import { updatePostApi } from '../../service/postService';
import { GlobalOutlined, TeamOutlined, LockOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

const PostEditModal = ({ open, onClose, post, onUpdate }) => {
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (post) {
      const isSharedPost = post.postType === 'share' || !!post.originalPostId;

      const currentCaption = isSharedPost ? post.sharedCaption : post.caption;

      setCaption(currentCaption || '');
      setVisibility(post.visibility || 'public');
    }
  }, [post]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await updatePostApi(post._id, { caption, visibility });
      if (res.success) {
        message.success("Cập nhật bài viết thành công!");
        onUpdate(res.post);
        onClose();
      } else {
        message.error(res.error || "Cập nhật thất bại.");
      }
    } catch (error) {
      message.error("Đã xảy ra lỗi kết nối.");
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
        <Button key="cancel" onClick={onClose}>
          Hủy
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          Lưu Thay đổi
        </Button>,
      ]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <label>Nội dung Bài viết (Caption)</label>
        <TextArea
          rows={4}
          placeholder="Thêm mô tả cho bài viết..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: 'red', marginRight: '4px' }}>*</span>
          Quyền xem
        </label>
        <Select
          value={visibility}
          onChange={(value) => setVisibility(value)}
          style={{ width: '100%' }}
        >
          <Option value="public">
            <GlobalOutlined style={{ marginRight: '8px' }} />
            Công khai (Public)
          </Option>
          <Option value="friend">
            <TeamOutlined style={{ marginRight: '8px' }} />
            Bạn bè (Friends)
          </Option>
          <Option value="private">
            <LockOutlined style={{ marginRight: '8px' }} />
            Chỉ mình tôi (Private)
          </Option>
        </Select>
      </div>
    </Modal>
  );
};

export default PostEditModal;