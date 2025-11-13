import Message from '../models/message.model.js';
import Conversation from '../models/conversation.model.js';

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