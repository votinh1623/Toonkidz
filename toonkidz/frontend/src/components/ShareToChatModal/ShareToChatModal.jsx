import React, { useState, useEffect } from 'react';
import { Modal, List, Avatar, Button, message, Spin } from 'antd';
import { Send } from 'lucide-react';
import { getConversations } from '../../service/messageService';
import { useOutletContext } from 'react-router-dom';

const getInitials = (name) => {
  if (!name) return "?";
  const words = name.split(' ');
  if (words.length > 1) {
    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const ShareToChatModal = ({ open, onClose, post, currentUser }) => {
  const context = useOutletContext();
  const socket = context?.socket;

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingMap, setSendingMap] = useState({});

  useEffect(() => {
    if (open) {
      setSendingMap({});
      const fetchConvos = async () => {
        setLoading(true);
        try {
          const res = await getConversations();
          if (res.success) {
            setConversations(res.conversations);
          } else {
            message.error("Không thể tải danh sách bạn bè.");
          }
        } catch (err) {
          message.error("Lỗi tải danh sách bạn bè.");
        } finally {
          setLoading(false);
        }
      };
      fetchConvos();
    }
  }, [open]);

  const handleSend = (convo) => {
    if (!socket || !post || !currentUser) {
      message.error("Lỗi kết nối socket hoặc thiếu thông tin.");
      return;
    }

    const receiver = convo.partner;
    setSendingMap(prev => ({ ...prev, [receiver._id]: true }));

    const postIdToSend = post._id;
    const authorId = post.userId._id;

    const postUrl = `${window.location.origin}/home/profile/${authorId}#${postIdToSend}`;

    const messageData = {
      content: `Hãy xem bài viết này: ${postUrl}`,
      receiverId: receiver._id,
      senderId: currentUser._id,
      conversationId: convo._id,
    };

    socket.emit('sendMessage', messageData);

    setTimeout(() => {
      setSendingMap(prev => ({ ...prev, [receiver._id]: false }));
      message.success(`Đã gửi cho ${receiver.name}!`);
    }, 500);
  };

  return (
    <Modal
      title="Chia sẻ đến bạn bè"
      open={open}
      onCancel={onClose}
      footer={null}
    >
      <Spin spinning={loading}>
        <List
          dataSource={conversations}
          renderItem={item => (
            <List.Item
              actions={[
                <Button
                  type="primary"
                  icon={<Send size={16} />}
                  onClick={() => handleSend(item)}
                  loading={sendingMap[item.partner._id]}
                >
                  Gửi
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={
                  item.partner.pfp ? (
                    <Avatar src={item.partner.pfp} />
                  ) : (
                    <div className="avatar-initials" style={{ width: 32, height: 32, fontSize: '0.9rem', marginRight: 0 }}>
                      {getInitials(item.partner.name)}
                    </div>
                  )
                }
                title={item.partner.name}
              />
            </List.Item>
          )}
        />
      </Spin>
    </Modal>
  );
};

export default ShareToChatModal;