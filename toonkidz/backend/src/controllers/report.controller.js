// backend/src/controllers/report.controller.js
import Report from '../models/report.model.js';
import Post from '../models/post.model.js';
import User from '../models/user.model.js';
import mongoose from 'mongoose';

export const createReport = async (req, res) => {
  try {
    const { targetId, targetType, reason } = req.body;
    const reporterId = req.user.id;

    if (!targetId || !targetType || !reason) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp đủ thông tin.' });
    }

    const newReport = new Report({
      reporterId,
      targetId: new mongoose.Types.ObjectId(targetId),
      targetType,
      reason
    });

    await newReport.save();
    res.status(201).json({ success: true, message: 'Đã gửi báo cáo thành công.' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi máy chủ: ' + error.message });
  }
};

export const getAllReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { status, targetType } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }
    if (targetType) {
      query.targetType = targetType;
    }

    const reports = await Report.find(query)
      .populate('reporterId', 'name email pfp')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const populatedReports = await Promise.all(reports.map(async (report) => {
      let targetDetail = null;

      if (report.targetType === 'Post') {
        targetDetail = await Post.findById(report.targetId)
          .populate('storyId', 'title')
          .populate('userId', 'name pfp');

      } else if (report.targetType === 'Comment') {
        const post = await Post.findOne({ "comments._id": report.targetId })
          .populate('storyId', 'title')
          .populate('userId', 'name pfp');

        if (post) {
          const comment = post.comments.find(c => c._id.equals(report.targetId));
          targetDetail = {
            commentText: comment?.text,
            postId: post._id,
            postAuthor: post.userId,
            storyTitle: post.storyId?.title // Lấy title (đã populate)
          };
        }
      } else if (report.targetType === 'User') {
        targetDetail = await User.findById(report.targetId).select('name email pfp');
      }

      return { ...report, targetDetail };
    }));

    const total = await Report.countDocuments(query);

    res.json({
      success: true,
      reports: populatedReports,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi máy chủ: ' + error.message });
  }
};

export const updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'reviewed', 'resolved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Trạng thái không hợp lệ.' });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy báo cáo.' });
    }

    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi máy chủ: ' + error.message });
  }
};