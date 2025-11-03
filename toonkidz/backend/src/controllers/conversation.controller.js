// backend/src/controllers/conversation.controller.js
import Conversation from '../models/conversation.model.js';
import User from '../models/user.model.js';

export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({
      'participants.userId': userId
    })
      .populate({
        path: 'participants.userId',
        select: 'name pfp'
      })
      .populate('lastMessage.senderId', 'name pfp')
      .sort({ lastMessageAt: -1 });

    const formattedConversations = conversations
      .map(convo => {
        const otherParticipant = convo.participants.find(
          p => p.userId && p.userId._id.toString() !== userId.toString()
        );

        if (!otherParticipant) {
          return null;
        }

        return {
          _id: convo._id,
          partner: otherParticipant.userId,
          lastMessage: convo.lastMessage,
          unreadCount: convo.unreadCounts.get(userId.toString()) || 0
        }
      })
      .filter(Boolean);

    res.json({ success: true, conversations: formattedConversations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const findOrCreateConversation = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { receiverId } = req.body;

    if (senderId.toString() === receiverId) {
      return res.status(400).json({ success: false, error: "Bạn không thể tự trò chuyện với chính mình." });
    }

    let conversation = await Conversation.findOne({
      type: 'direct',
      'participants.userId': { $all: [senderId, receiverId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        type: 'direct',
        participants: [{ userId: senderId }, { userId: receiverId }],
        lastMessageAt: Date.now()
      });
    }
    res.json({ success: true, conversationId: conversation._id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};