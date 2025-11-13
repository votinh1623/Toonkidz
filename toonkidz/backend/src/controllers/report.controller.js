// backend/src/controllers/report.controller.js
import Report from '../models/report.model.js';
import Post from '../models/post.model.js';
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
      targetId,
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
    const status = req.query.status;

    const query = {};
    if (status) {
      query.status = status;
    }

    const reports = await Report.find(query)
      .populate('reporterId', 'name email pfp')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const populatedReports = await Promise.all(reports.map(async (report) => {
      let targetDetail = null;
      if (report.targetType === 'Post') {
        targetDetail = await Post.findById(report.targetId).select('caption storyId').populate('storyId', 'title');
      } else if (report.targetType === 'Comment') {
        const post = await Post.findOne({ "comments._id": report.targetId });
        if (post) {
          const comment = post.comments.id(report.targetId);
          targetDetail = {
            commentText: comment.text,
            postId: post._id,
            storyTitle: (await post.populate('storyId', 'title')).storyId.title
          };
        }
      }
      return { ...report.toObject(), targetDetail };
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