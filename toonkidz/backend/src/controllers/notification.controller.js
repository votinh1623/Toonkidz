// backend/src/controllers/notification.controller.js
import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';

const getIo = () => {
  return global.io;
}

export const createNotification = async ({ recipientId, senderId, type, entityId, message, targetUrl = '' }) => {
  if (recipientId.toString() === senderId.toString()) return;

  try {
    const notification = await Notification.create({
      recipientId,
      senderId,
      type,
      entityId,
      message,
      targetUrl
    });

    await notification.populate('senderId', 'name pfp');

    const recipientSocketId = global.userSocketMap[recipientId.toString()];
    const ioInstance = getIo();

    if (recipientSocketId && ioInstance) {
      ioInstance.to(recipientSocketId).emit('newNotification', notification);
    }

    return notification;

  } catch (error) {
    console.error("Error creating notification:", error.message);
  }
};

export const getNotifications = async (req, res) => {
  const userId = req.user._id;
  try {
    const notifications = await Notification.find({ recipientId: userId })
      .populate('senderId', 'name pfp')
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({
      recipientId: userId,
      isRead: false
    });

    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const markAllRead = async (req, res) => {
  const userId = req.user._id;
  try {
    await Notification.updateMany(
      { recipientId: userId, isRead: false },
      { $set: { isRead: true } }
    );

    const socketId = global.userSocketMap[userId.toString()];
    const ioInstance = getIo();
    if (socketId && ioInstance) {
      ioInstance.to(socketId).emit('notificationsRead', { unreadCount: 0, markAll: true });
    }

    res.json({ success: true, message: "Đã đánh dấu tất cả là đã đọc." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const markOneRead = async (req, res) => {
  const userId = req.user._id;
  const { notificationId } = req.params;

  try {
    const result = await Notification.updateOne(
      { _id: notificationId, recipientId: userId, isRead: false },
      { $set: { isRead: true } }
    );

    if (result.modifiedCount === 0) {
      return res.json({ success: true, message: "Trạng thái đã được cập nhật hoặc không cần thiết." });
    }

    const unreadCount = await Notification.countDocuments({ recipientId: userId, isRead: false });

    const socketId = global.userSocketMap[userId.toString()];
    const ioInstance = getIo();
    if (socketId && ioInstance) {
      ioInstance.to(socketId).emit('notificationReadOne', {
        unreadCount,
        notificationId
      });
    }

    res.json({ success: true, message: "Đã đánh dấu thông báo là đã đọc." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};