// backend/src/socket/socket.js
import Message from '../models/message.model.js';
import Conversation from '../models/conversation.model.js';
import mongoose from 'mongoose';

const userSocketMap = {};
const getOnlineUserIds = () => Object.keys(userSocketMap);

export const initializeSocketIO = (io) => {

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId && userId !== "undefined") {
      console.log(`Một người dùng đã kết nối: ${socket.id}, userId: ${userId}`);
      userSocketMap[userId] = socket.id;
    }

    io.emit('getOnlineUsers', getOnlineUserIds());

    socket.on('sendMessage', async (data) => {
      try {
        const message = await internalSendMessage(data.content, data.receiverId, userId);

        const receiverSocketId = userSocketMap[data.receiverId];
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receiveMessage', message);
        }
        socket.emit('messageSent', message);
      } catch (error) {
        console.error("Error handling message:", error.message);
        socket.emit('messageError', { error: "Failed to send message" });
      }
    });

    socket.on('markAsRead', async (data) => {
      try {
        const { conversationId } = data;
        if (!userId || !conversationId) return;

        await Conversation.updateOne(
          { _id: conversationId },
          { $set: { [`unreadCounts.${userId}`]: 0 } }
        );
        socket.emit('unreadCountReset', { conversationId });
      } catch (err) {
        console.error("Error marking as read:", err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Người dùng đã ngắt kết nối: ${socket.id}`);
      if (userId && userId !== "undefined") {
        delete userSocketMap[userId];
      }
      io.emit('getOnlineUsers', getOnlineUserIds());
    });
  });
};

const internalSendMessage = async (content, receiverId, senderId) => {
  let conversation = await Conversation.findOne({
    type: 'direct',
    'participants.userId': { $all: [senderId, receiverId] }
  });

  if (!conversation) {
    conversation = await Conversation.create({
      type: 'direct',
      participants: [
        { userId: senderId },
        { userId: receiverId }
      ],
      unreadCounts: { [senderId]: 0, [receiverId]: 0 }
    });
  }

  const newMessage = new Message({
    conversationId: conversation._id,
    senderId: senderId,
    content: content
  });

  conversation.lastMessage = {
    _id: newMessage._id,
    content: newMessage.content,
    senderId: senderId,
    createdAt: newMessage.createdAt
  };
  conversation.lastMessageAt = newMessage.createdAt;

  const currentUnread = conversation.unreadCounts.get(receiverId) || 0;
  conversation.unreadCounts.set(receiverId, currentUnread + 1);
  conversation.unreadCounts.set(senderId, 0);

  await Promise.all([newMessage.save(), conversation.save()]);
  await newMessage.populate('senderId', 'name pfp');

  return newMessage;
};