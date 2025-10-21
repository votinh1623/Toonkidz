// src/pages/ProfilePage/ChangePasswordPopup.jsx
import React, { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { changePassword } from '../../service/userService';
import Swal from 'sweetalert2/dist/sweetalert2.js'
import 'sweetalert2/src/sweetalert2.scss'

const ChangePasswordPopup = ({ open, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (values) => {
    setLoading(true);
    try {
      const res = await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      if (res.success) {
        Swal.fire({
          title: "Success!",
          icon: "success",
          draggable: true
        });
        form.resetFields();
        onClose();
      } else {
        Swal.fire({
          title: "Error!",
          icon: "error",
          draggable: true
        });
      }

    } catch (error) {
      console.error("Change password error:", error);
      message.error("Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Đổi mật khẩu"
      open={open}
      onCancel={onClose}
      footer={null}
      className="popup-container password-popup"
      centered
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleChangePassword} className="popup-form">
        <Form.Item
          label="Mật khẩu hiện tại"
          name="currentPassword"
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' }]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          label="Mật khẩu mới"
          name="newPassword"
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
            { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
          ]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          label="Xác nhận mật khẩu mới"
          name="confirmPassword"
          rules={[
            { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Hai mật khẩu mới không khớp!'));
              },
            }),
          ]}
          dependencies={['newPassword']}
        >
          <Input.Password />
        </Form.Item>
        <Button className="password-submit" type="primary" htmlType="submit" loading={loading} block>
          Đổi mật khẩu
        </Button>
      </Form>
    </Modal>
  );
};

export default ChangePasswordPopup;