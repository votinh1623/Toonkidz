// backend/src/controllers/message.controller.js
import Message from '../models/message.model.js';
import Conversation from '../models/conversation.model.js';

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.userId': userId
    });
    if (!conversation) return res.status(403).json({ error: "Unauthorized" });

    const messages = await Message.find({ conversationId })
      .populate('senderId', 'name pfp')
      .sort({ createdAt: 1 });

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};