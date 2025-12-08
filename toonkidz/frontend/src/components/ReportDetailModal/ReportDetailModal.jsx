import React, { useState } from 'react';
import { Modal, Tag, Typography, Button, Space, message, Image, Divider } from 'antd';
import { UserOutlined, PictureOutlined } from '@ant-design/icons';
import './ReportDetailModal.scss';
import { useNavigate } from 'react-router-dom';

const { Text, Paragraph, Title } = Typography;

const getInitials = (name) => {
  if (!name) return "?";
  const words = name.split(' ');
  if (words.length > 1) {
    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const statusMap = {
  pending: { text: "Chờ xử lý", color: "orange" },
  reviewed: { text: "Đang xem xét", color: "blue" },
  resolved: { text: "Đã giải quyết", color: "green" },
  rejected: { text: "Đã từ chối", color: "red" },
};

const ReportDetailModal = ({ open, onClose, report }) => {
  const navigate = useNavigate();

  if (!report) return null;

  const { reporterId, targetType, reason, details, evidenceImages, status, createdAt, targetDetail } = report;
  const statusInfo = statusMap[status] || { text: status, color: "default" };

  const handleViewContext = () => {
    if (!targetDetail) {
      message.error("Không thể xem (đối tượng có thể đã bị xóa).");
      return;
    }

    let authorId = null;
    let hash = "";

    if (targetType === 'Post') {
      authorId = targetDetail.userId?._id;
      hash = `#${targetDetail._id}`;
    } else if (targetType === 'Comment') {
      authorId = targetDetail.postAuthor?._id;
      hash = `#${targetDetail.postId}&comment=${report.targetId}`;
    } else if (targetType === 'User') {
      authorId = targetDetail._id;
    }

    if (authorId) {
      onClose();
      navigate(`/home/profile/${authorId}${hash}`);
    } else {
      message.error("Không thể tìm thấy tác giả của nội dung này.");
    }
  };

  const renderTargetDetail = () => {
    if (!targetDetail) {
      return <Paragraph type="danger">Không thể tải chi tiết đối tượng (có thể đã bị xóa).</Paragraph>;
    }

    switch (targetType) {
      case 'Post':
        return (
          <>
            <Title level={5}>Bài viết bị báo cáo:</Title>
            <Text type="secondary">Tác giả: {targetDetail.userId?.name || 'N/A'} | Truyện: {targetDetail.storyId?.title || 'N/A'}</Text>
            <Paragraph className="report-detail-content" code>
              {targetDetail.caption || '[Không có caption]'}
            </Paragraph>
          </>
        );
      case 'Comment':
        return (
          <>
            <Title level={5}>Bình luận bị báo cáo:</Title>
            <Text type="secondary">Tác giả post: {targetDetail.postAuthor?.name || 'N/A'} | Truyện: {targetDetail.storyTitle || 'N/A'}</Text>
            <Paragraph className="report-detail-content" code>
              {targetDetail.commentText}
            </Paragraph>
          </>
        );
      case 'User':
        return (
          <>
            <Title level={5}>Người dùng bị báo cáo:</Title>
            <div className="report-user-info">
              {targetDetail.pfp ? (
                <img className="avatar-img" src={targetDetail.pfp} alt={targetDetail.name} />
              ) : (
                <div className="avatar-initials">
                  {getInitials(targetDetail.name)}
                </div>
              )}
              <Space direction="vertical" size={0}>
                <Text strong>{targetDetail.name}</Text>
                <Text type="secondary">{targetDetail.email}</Text>
              </Space>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      title="Chi tiết Báo cáo"
      open={open}
      onCancel={onClose}
      width={700}
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
        <Button key="context" type="primary" onClick={handleViewContext} disabled={!targetDetail}>
          Xem trong ngữ cảnh
        </Button>
      ]}
    >
      <div className="report-detail-modal-body">
        <div className="report-section">
          <div className="report-row">
            <Text strong>Người báo cáo:</Text>
            <Space>
              {reporterId?.pfp ? (
                <img className="avatar-small" src={reporterId.pfp} alt={reporterId.name} />
              ) : (
                <div className="avatar-initials-small">{getInitials(reporterId?.name)}</div>
              )}
              <Text>{reporterId?.name} ({reporterId?.email})</Text>
            </Space>
          </div>
          <div className="report-row">
            <Text strong>Ngày báo cáo:</Text>
            <Text>{new Date(createdAt).toLocaleString('vi-VN')}</Text>
          </div>
          <div className="report-row">
            <Text strong>Trạng thái:</Text>
            <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
          </div>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        <div className="report-section">
          <Title level={5}>Nội dung báo cáo</Title>
          <div className="report-row">
            <Text strong>Lý do chính:</Text>
            <Tag color="volcano">{reason}</Tag>
          </div>
          {details && (
            <div className="report-row vertical">
              <Text strong>Chi tiết thêm:</Text>
              <Paragraph className="report-text-box">
                {details}
              </Paragraph>
            </div>
          )}

          {evidenceImages && evidenceImages.length > 0 && (
            <div className="report-row vertical">
              <Text strong><PictureOutlined /> Ảnh minh chứng ({evidenceImages.length}):</Text>
              <div className="evidence-gallery">
                <Image.PreviewGroup>
                  {evidenceImages.map((img, index) => (
                    <div key={index} className="evidence-item">
                      <Image
                        src={img}
                        width={100}
                        height={100}
                        style={{ objectFit: 'cover', borderRadius: '8px' }}
                      />
                    </div>
                  ))}
                </Image.PreviewGroup>
              </div>
            </div>
          )}
        </div>

        <Divider style={{ margin: '12px 0' }} />

        <div className="report-section target-section">
          {renderTargetDetail()}
        </div>
      </div>
    </Modal>
  );
};

export default ReportDetailModal;