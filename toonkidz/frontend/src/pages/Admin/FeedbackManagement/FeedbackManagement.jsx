// src/pages/Admin/FeedbackManagement/FeedbackManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Tag, Typography, Button, Space, Input, Modal, Form, message, Tooltip, Spin } from 'antd';
import { CheckCircleOutlined, MailOutlined, SendOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getAllFeedback, replyToFeedback } from '../../../service/feedbackService';
import './FeedbackManagement.scss';

const { Title } = Typography;

const FeedbackManagement = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [form] = Form.useForm();

  const [isSendingReply, setIsSendingReply] = useState(false);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllFeedback();
      if (res.success) {
        setFeedback(res.feedback);
      } else {
        message.error(res.error || "Không thể tải danh sách phản hồi.");
      }
    } catch (error) {
      message.error("Lỗi kết nối khi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, []);

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
    message.loading({ content: 'Đang gửi phản hồi...', key: 'sendKey' });

    try {
      const res = await replyToFeedback(selectedRequest._id, values.replyContent);

      if (res.success) {
        setFeedback(prev => prev.map(f =>
          f._id === selectedRequest._id ? { ...f, status: 'resolved', adminReply: { text: values.replyContent, repliedAt: new Date() } } : f
        ));

        message.success({ content: `Đã gửi phản hồi đến ${selectedRequest.senderEmail}!`, key: 'sendKey', duration: 3 });
        setIsModalOpen(false);

      } else {
        message.error({ content: res.error || 'Gửi phản hồi thất bại.', key: 'sendKey' });
      }
    } catch (error) {
      message.error({ content: 'Lỗi gửi phản hồi server.', key: 'sendKey' });
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
          <span style={{ fontSize: '0.8rem', color: '#666' }}>{record.senderEmail}</span>
        </Space>
      )
    },
    {
      title: 'Nội dung',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
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
      render: (status) => (
        <Tag color={status === 'resolved' ? 'green' : 'red'}>
          {status === 'resolved' ? 'Đã phản hồi' : 'Chờ xử lý'}
        </Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      render: (text, record) => (
        <>
          <Tooltip title={record.status === 'resolved' ? 'Xem chi tiết' : 'Phản hồi ngay'}>
            <Button
              type="primary"
              icon={record.status === 'resolved' ? <CheckCircleOutlined /> : <MailOutlined />}
              onClick={() => handleViewAndReply(record)}
              disabled={record.status === 'resolved'}
            />
          </Tooltip>
        </>
      )
    }
  ];

  return (
    <div className="feedback-management">
      <Title level={2}>Quản lý Phản hồi Khách</Title>
      <p>Phản hồi được gửi từ cửa sổ chat nổi trên trang Đăng nhập.</p>

      <Card className="feedback-table-card">
        <Table
          columns={columns}
          dataSource={feedback}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={`Phản hồi yêu cầu: ${selectedRequest?.senderName}`}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
      >
        {selectedRequest && (
          <div className="reply-modal-content">
            <p><strong>Email:</strong> {selectedRequest.senderEmail}</p>
            <p><strong>Nội dung:</strong></p>
            <Card className="content-box">
              {selectedRequest.content}
            </Card>

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