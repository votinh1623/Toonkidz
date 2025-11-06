// backend/src/controllers/feedback.controller.js
import Feedback from '../models/feedback.model.js';
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const postGuestFeedback = async (req, res) => {
  try {
    const { name, email, content } = req.body;

    if (!name || !email || !content) {
      return res.status(400).json({ success: false, error: "Thiếu thông tin người gửi hoặc nội dung." });
    }

    const newFeedback = new Feedback({
      senderName: name,
      senderEmail: email,
      content: content,
      status: 'pending'
    });
    await newFeedback.save();

    res.status(201).json({ success: true, message: "Phản hồi đã được ghi nhận." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find().sort({ status: 1, createdAt: -1 });
    res.json({ success: true, feedback });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const replyToFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { replyContent } = req.body;
    const adminName = req.user.name;

    const feedback = await Feedback.findById(id);

    if (!feedback || feedback.status === 'resolved') {
      return res.status(404).json({ success: false, error: "Yêu cầu không tồn tại hoặc đã được xử lý." });
    }

    await transporter.sendMail({
      from: `"Bộ phận Hỗ trợ Toonkidz" <${process.env.EMAIL_USER}>`,
      to: feedback.senderEmail,
      subject: `[Phản hồi] Yêu cầu hỗ trợ của bạn (Ref: ${id})`,
      html: `
                <p>Kính gửi ${feedback.senderName},</p>
                <p>Bộ phận hỗ trợ đã xem xét yêu cầu của bạn (Nội dung: "${feedback.content}").</p>
                <hr>
                <p><strong>Phản hồi từ Quản trị viên ${adminName}:</strong></p>
                <p style="white-space: pre-wrap; padding: 15px; background: #f0f0f0; border-radius: 8px;">${replyContent}</p>
                <hr>
                <p>Cảm ơn bạn đã tin tưởng Toonkidz!</p>
            `,
    });

    feedback.status = 'resolved';
    feedback.adminReply = {
      text: replyContent,
      repliedAt: Date.now()
    };
    await feedback.save();

    res.json({ success: true, message: "Email phản hồi đã được gửi thành công." });
  } catch (error) {
    console.error("Error sending reply email:", error);
    res.status(500).json({ success: false, error: "Lỗi khi gửi email hoặc cập nhật database." });
  }
};