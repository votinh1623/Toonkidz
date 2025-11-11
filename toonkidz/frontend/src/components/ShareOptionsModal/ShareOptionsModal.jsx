import React from 'react';
import { Modal, Button, Space } from 'antd';
import { Send, User, Copy } from 'lucide-react';
import './ShareOptionsModal.scss';

const ShareOptionsModal = ({ open, onClose, post, onShareToProfile, onShareToChat }) => {

  const handleCopyToClipboard = () => {
    const postUrl = `${window.location.origin}/home/profile/${post.userId._id}#${post._id}`;
    navigator.clipboard.writeText(postUrl);
    message.success("Đã sao chép link bài viết!");
    onClose();
  };

  return (
    <Modal
      title="Chia sẻ bài viết"
      open={open}
      onCancel={onClose}
      footer={null}
      className="share-options-modal"
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Button
          className="share-option-btn"
          icon={<User size={20} />}
          onClick={onShareToProfile}
        >
          Chia sẻ lên trang cá nhân
        </Button>
        <Button
          className="share-option-btn"
          icon={<Send size={20} />}
          onClick={onShareToChat}
        >
          Gửi trong tin nhắn
        </Button>
        <Button
          className="share-option-btn"
          icon={<Copy size={20} />}
          onClick={handleCopyToClipboard}
        >
          Sao chép liên kết
        </Button>
      </Space>
    </Modal>
  );
};

export default ShareOptionsModal;