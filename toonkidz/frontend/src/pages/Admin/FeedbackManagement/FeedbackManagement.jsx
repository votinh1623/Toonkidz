// src/pages/Admin/FeedbackManagement/FeedbackManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Table, Tag, Space, Tooltip, Modal, Form, message, Button, Input } from 'antd';
import { CheckCircleOutlined, MailOutlined, SendOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getAllFeedback, replyToFeedback } from '../../../service/feedbackService';
import Swal from 'sweetalert2';
import './FeedbackManagement.scss';

const statusMap = {
  pending: { text: 'Chờ xử lý', color: 'orange' },
  resolved: { text: 'Đã phản hồi', color: 'green' },
};

const FeedbackManagement = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 5, total: 0 });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [form] = Form.useForm();
  const [isSendingReply, setIsSendingReply] = useState(false);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllFeedback(pagination.current, pagination.pageSize);
      if (res.success) {
        setFeedback(res.feedback || []);
        setPagination(prev => ({
          ...prev,
          total: res.total || res.feedback?.length || 0,
        }));
      } else {
        message.error(res.error || 'Không thể tải danh sách phản hồi.');
      }
    } catch (error) {
      message.error('Lỗi kết nối khi tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const handleViewAndReply = (record) => {
    setSelectedRequest(record);
    form.setFieldsValue({ replyContent: record.adminReply?.text || '' });
    setIsModalOpen(true);
  };

  const handleSendReply = async (values) => {
    if (!selectedRequest || selectedRequest.status === 'resolved') return;

    setIsSendingReply(true);

    try {
      const res = await replyToFeedback(selectedRequest._id, values.replyContent);

      if (res.success) {
        setFeedback(prev =>
          prev.map(f =>
            f._id === selectedRequest._id
              ? {
                ...f,
                status: 'resolved',
                adminReply: { text: values.replyContent, repliedAt: new Date() },
              }
              : f
          )
        );

        Swal.fire({
          title: 'Thành công!',
          html: `Đã gửi phản hồi đến <strong>${selectedRequest.senderEmail}</strong>`,
          icon: 'success',
          confirmButtonText: 'OK',
        });

        setIsModalOpen(false);
      } else {
        message.error(res.error || 'Gửi phản hồi thất bại.');
      }
    } catch (error) {
      message.error('Lỗi gửi phản hồi server.');
    } finally {
      setIsSendingReply(false);
    }
  };

  const columns = [
    {
      title: 'Người gửi (Tên/Email)',
      dataIndex: 'senderName',
      key: 'sender',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <strong>{text}</strong>
          <span className="sender-email">{record.senderEmail}</span>
        </Space>
      ),
    },
    {
      title: 'Nội dung',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (text) => <span className="content-snippet">{text}</span>,
    },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'time',
      width: 150,
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const statusInfo = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 80,
      render: (text, record) => (
        <Tooltip title={record.status === 'resolved' ? 'Xem chi tiết' : 'Phản hồi'}>
          <Button
            className="action-btn reply"
            icon={record.status === 'resolved' ? <CheckCircleOutlined /> : <MailOutlined />}
            onClick={() => handleViewAndReply(record)}
            disabled={record.status === 'resolved'}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="feedback-management">
      <div className="feedback-management__header">
        <h2>Quản lý Phản hồi Khách</h2>
        <p className="feedback-description">Phản hồi được gửi từ cửa sổ chat nổi trên trang Đăng nhập.</p>
      </div>

      <div className="feedback-management__table-container">
        <Table
          columns={columns}
          dataSource={feedback}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page, pageSize) => {
              setPagination(prev => ({
                ...prev,
                current: page,
                pageSize: pageSize,
              }));
            },
          }}
        />
      </div>

      <Modal
        title={`Phản hồi yêu cầu: ${selectedRequest?.senderName}`}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
        className="feedback-modal"
      >
        {selectedRequest && (
          <div className="reply-modal-content">
            <div className="modal-info-item">
              <label>Email:</label>
              <p>{selectedRequest.senderEmail}</p>
            </div>

            <div className="modal-info-item">
              <label>Nội dung Phản hồi:</label>
              <div className="content-box">
                {selectedRequest.content}
              </div>
            </div>

            <Form form={form} layout="vertical" onFinish={handleSendReply}>
              <Form.Item
                name="replyContent"
                label="Nội dung Phản hồi (qua Email)"
                rules={[{ required: true, message: 'Vui lòng nhập nội dung phản hồi!' }]}
              >
                {selectedRequest.status === 'resolved' ? (
                  <Input.TextArea
                    rows={4}
                    value={selectedRequest.adminReply.text}
                    disabled
                  />
                ) : (
                  <Input.TextArea rows={4} placeholder="Nhập nội dung email phản hồi..." />
                )}
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                icon={<SendOutlined />}
                block
                disabled={selectedRequest.status === 'resolved' || isSendingReply}
                loading={isSendingReply}
                className="submit-btn"
              >
                {selectedRequest.status === 'resolved' ? 'Đã gửi Email Phản hồi' : 'Gửi Email Phản hồi'}
              </Button>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FeedbackManagement;