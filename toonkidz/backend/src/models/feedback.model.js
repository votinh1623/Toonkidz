// backend/src/models/feedback.model.js
import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  senderName: {
    type: String,
    required: true,
    trim: true,
  },
  senderEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  content: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'resolved'],
    default: 'pending',
  },
  adminReply: {
    text: { type: String },
    repliedAt: { type: Date }
  }
}, {
  timestamps: true
});

const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;