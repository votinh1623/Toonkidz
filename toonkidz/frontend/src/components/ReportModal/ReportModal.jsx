// src/components/ReportModal/ReportModal.jsx
import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Button, message } from 'antd';
import { createReport } from '../../service/reportService';

const { Option } = Select;

const ReportModal = ({ open, onClose, targetId, targetType, targetName, onReported }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const reasons = {
    Post: ["Nội dung không phù hợp", "Spam", "Thông tin sai lệch", "Ngôn từ thù ghét"],
    Comment: ["Ngôn ngữ xúc phạm", "Spam", "Đe dọa"],
    User: ["Tài khoản giả mạo", "Quấy rối", "Ngôn từ độc hại"]
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const data = {
        targetId,
        targetType,
        reason: values.reason,
        details: values.details,
      };

      const res = await createReport(data);
      if (res.success) {
        message.success(`Đã báo cáo ${targetType} thành công.`);
        onReported();
        onClose();
      } else {
        message.error(res.error || "Gửi báo cáo thất bại.");
      }
    } catch (error) {
      message.error("Lỗi kết nối.");
    } finally {
      setLoading(false);
    }
  };

  const displayTitle = targetType === 'User' ? targetName : `${targetType} của ${targetName}`;

  return (
    <Modal
      title={`Báo cáo: ${displayTitle}`}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="back" onClick={onClose} disabled={loading}>
          Hủy
        </Button>,
        <Button key="submit" type="primary" danger loading={loading} onClick={form.submit}>
          Gửi Báo cáo
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="reason"
          label="Lý do báo cáo"
          rules={[{ required: true, message: 'Vui lòng chọn lý do.' }]}
        >
          <Select placeholder="Chọn lý do chính">
            {reasons[targetType]?.map((reason) => (
              <Option key={reason} value={reason}>{reason}</Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="details"
          label="Chi tiết (Tùy chọn)"
        >
          <Input.TextArea rows={3} placeholder="Mô tả chi tiết hơn nếu cần..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ReportModal;