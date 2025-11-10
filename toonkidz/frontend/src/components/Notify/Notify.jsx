// src/components/Notify/Notify.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { BellOutlined, MailOutlined, CheckCircleOutlined, UserOutlined } from '@ant-design/icons';
import { Badge, Button, Dropdown, Menu, Spin, Space, Typography, Modal, message } from 'antd';
import { Bell } from 'lucide-react';
import { getNotifications, markAllRead, markOneRead } from '../../service/notificationService';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

import "./Notify.scss";
import { useNavigate } from 'react-router-dom';
const { Title, Text, Paragraph } = Typography;

const NotificationDetailModal = ({ open, onClose, notification }) => {
  if (!notification || !notification.senderId) return null;

  const getDetailMessage = (n) => {
    switch (n.type) {
      case 'like_post':
        return `${n.senderId.name} đã thích bài viết của bạn.`;
      case 'comment_post':
        return `${n.message}`;
      case 'follow':
        return `${n.senderId.name} đã bắt đầu theo dõi bạn.`;
      case 'admin_message':
        return `Tin nhắn từ Quản trị viên: ${n.message}`;
      default:
        return 'Có thông báo mới.';
    }
  };

  return (
    <Modal
      title="Chi tiết Thông báo"
      open={open}
      onCancel={onClose}
      footer={null}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Text type="secondary">{dayjs(notification.createdAt).format('HH:mm - DD/MM/YYYY')}</Text>
        <Title level={4}>
          {getDetailMessage(notification)}
        </Title>
        {/* <Paragraph>
          Người gửi: <Text strong>{notification.senderId.name}</Text>
        </Paragraph> */}
        {/* <Text type="secondary">
          {notification.message}
        </Text> */}
      </Space>
    </Modal>
  );
};


const NotificationDropdown = ({ notifications, onMarkAllRead, loading, onViewDetail }) => {
  return (
    <div className="notify__dropdown">
      <Spin spinning={loading}>

        <div className="notify__header">
          <div className="notify__header-title">
            <BellOutlined /> Thông báo
          </div>
          <Button type="link"
            onClick={onMarkAllRead}
            disabled={notifications.every(n => n.isRead)}>
            Đánh dấu đã đọc
          </Button>
        </div>

        <div className="notify__body">
          {notifications.map(n => (
            <div
              key={n._id}
              className={`notify__item ${n.isRead ? '' : 'unread'}`}
              onClick={() => onViewDetail(n)}
            >
              <div className={`notify__item-icon ${n.type === 'follow' ? 'icon-follow' :
                n.type === 'like_post' ? 'icon-like' :
                  n.type === 'comment_post' ? 'icon-comment' : 'icon-admin'
                }`}>
                {n.type === 'follow' && <UserOutlined />}
                {n.type === 'like_post' && <CheckCircleOutlined />}
                {(n.type === 'comment_post' || n.type === 'admin_message') && <MailOutlined />}
              </div>

              <div className="notify__item-content">
                <div className="notify__item-title">{n.message}</div>
                <div className="notify__item-time">
                  {dayjs(n.createdAt).fromNow()}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="notify__footer">
          <Button type="link" block>Xem tất cả</Button>
        </div>

      </Spin>
    </div>
  );
};


function Notify({ socket, totalUnreadMessages }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getNotifications();
      if (res.success) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    if (socket) {
      socket.on('newNotification', (newNotif) => {
        setNotifications(prev => [newNotif, ...prev]);
        setUnreadCount(prev => prev + 1);
      });
      socket.on('notificationsRead', () => {
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      });
    }

    return () => {
      if (socket) {
        socket.off('newNotification');
        socket.off('notificationsRead');
      }
    }
  }, [socket, fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
    } catch (err) {
      message.error("Không thể đánh dấu đã đọc.");
    }
  };

  const handleViewDetail = async (notification) => {
    if (notification.targetUrl) {
      setIsDropdownOpen(false);
      navigate(notification.targetUrl);
    } else {
      setCurrentNotification(notification);
      setIsDetailModalOpen(true);
      setIsDropdownOpen(false);
    }

    if (!notification.isRead) {
      try {
        await markOneRead(notification._id);
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }

      setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const dropdownProps = {
    open: isDropdownOpen,
    onOpenChange: (open) => {
      if (isDetailModalOpen) {
        return;
      }
      setIsDropdownOpen(open);
    },
    overlay: (
      <NotificationDropdown
        notifications={notifications}
        onMarkAllRead={handleMarkAllRead}
        loading={loading}
        onViewDetail={handleViewDetail}
      />
    ),
    trigger: ['click'],
    placement: 'bottomRight',
  };

  return (
    <>
      <Dropdown {...dropdownProps}>
        <Badge count={unreadCount} overflowCount={99}>
          <Button type="text" className="notify-btn">
            <Bell size={20} className='notify__icon' />
          </Button>
        </Badge>
      </Dropdown>

      <NotificationDetailModal
        open={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        notification={currentNotification}
      />
    </>
  )
}

export default Notify;