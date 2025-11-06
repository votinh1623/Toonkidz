// src/components/GuestChatWidget/GuestChatWidget.jsx
import React, { useState, useRef } from 'react';
import { Button, Input, Form, message, Modal } from 'antd';
import { MessageCircle, Send, X } from 'lucide-react';
import io from 'socket.io-client';
import './GuestChatWidget.scss';
import { postGuestFeedback } from '../../service/feedbackService';

const guestSocket = io("http://localhost:3000", { autoConnect: false });

const GuestChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [form] = Form.useForm();
  const [isSent, setIsSent] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  const handleSubmit = async (values) => {
    setIsSending(true);

    try {
      const res = await postGuestFeedback(values);

      if (res.success) {
        setIsSent(true);
        message.success("Tin nhắn của bạn đã được gửi tới quản trị viên!");
      } else {
        message.error(res.error || "Gửi thất bại. Vui lòng thử lại sau!");
      }
    } catch (error) {
      message.error("Lỗi kết nối server. Vui lòng thử lại.");
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) {
    return (
      <Button className="chat-fab" type="primary" shape="circle" icon={<MessageCircle size={24} />} onClick={handleOpen} />
    );
  }

  return (
    <div className="guest-chat-window">
      <header className="chat-header">
        <h3>Liên hệ Quản trị viên</h3>
        <Button type="text" icon={<X size={16} />} onClick={handleClose} />
      </header>

      <div className="chat-body">
        {isSent ? (
          <div className="sent-success-message">
            <MessageCircle size={40} style={{ color: '#6c63ff' }} />
            <p>Cảm ơn bạn. Chúng tôi đã nhận được tin nhắn và sẽ phản hồi qua email sớm nhất.</p>
          </div>
        ) : (
          <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
            <p className="description">Vui lòng nhập thông tin để chúng tôi có thể phản hồi.</p>
            <Form.Item
              name="name"
              rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
            >
              <Input placeholder="Họ tên" />
            </Form.Item>
            <Form.Item
              name="email"
              rules={[{ required: true, message: 'Vui lòng nhập email!' }, { type: 'email', message: 'Email không hợp lệ!' }]}
            >
              <Input placeholder="Email (để nhận phản hồi)" />
            </Form.Item>
            <Form.Item
              name="content"
              rules={[{ required: true, message: 'Vui lòng nhập nội dung!' }]}
            >
              <Input.TextArea rows={3} placeholder="Nội dung bạn muốn phản ánh/hỏi" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={isSending} block icon={<Send size={16} />}>
              Gửi tin nhắn
            </Button>
          </Form>
        )}
      </div>
    </div>
  );
};

export default GuestChatWidget;