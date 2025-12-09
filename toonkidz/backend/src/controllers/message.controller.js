import Message from '../models/message.model.js';
import Conversation from '../models/conversation.model.js';
// import Post from '../models/post.model.js';

export const getMessages = async (req, res) => {
  const { conversationId } = req.params;
  const currentUserId = req.user._id;
  const populatePost = req.query.populatePost === 'true';

  try {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation || !conversation.participants.some(p => p.userId.equals(currentUserId))) {
      return res.status(403).json({ success: false, error: "Unauthorized access to conversation" });
    }

    let messageQuery = Message.find({ conversationId });
    messageQuery = messageQuery.populate('senderId', 'name pfp');

    if (populatePost) {
      messageQuery = messageQuery.populate({
        path: 'sharedPostId',
        populate: [
          { path: 'userId', select: 'name pfp' },
          { path: 'storyId' },
          {
            path: 'originalPostId',
            populate: [
              { path: 'userId', select: 'name pfp' },
              { path: 'storyId' }
            ]
          }
        ]
      });
    }

    const messages = await messageQuery.sort({ createdAt: 1 });

    await Conversation.updateOne(
      { _id: conversationId },
      { $set: { [`unreadCounts.${currentUserId}`]: 0 } }
    );


    res.json({ success: true, messages });

  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const sendMessageHTTP = async (req, res) => {
  try {
    const { content, receiverId, conversationId, messageType } = req.body;
    const senderId = req.user._id;
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    } else {
      conversation = await Conversation.findOne({
        type: 'direct',
        'participants.userId': { $all: [senderId, receiverId] }
      });
    }

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
      content: content,
      messageType: messageType || 'text',
      sharedPostId: null
    });

    conversation.lastMessage = {
      _id: newMessage._id,
      content: newMessage.content,
      senderId: senderId,
      createdAt: newMessage.createdAt,
      messageType: messageType
    };
    conversation.lastMessageAt = newMessage.createdAt;

    const currentUnread = conversation.unreadCounts.get(receiverId) || 0;
    conversation.unreadCounts.set(receiverId, currentUnread + 1);
    conversation.unreadCounts.set(senderId, 0);

    await Promise.all([newMessage.save(), conversation.save()]);

    await newMessage.populate('senderId', 'name pfp');

    res.status(201).json(newMessage);

  } catch (error) {
    console.log("Error in sendMessage controller", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};