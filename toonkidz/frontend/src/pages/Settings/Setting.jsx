import React, { useState, useEffect } from "react";
import {
  Card,
  Tabs,
  Form,
  Input,
  Button,
  Switch,
  Select,
  Slider,
  message,
  Divider,
} from "antd";
import {
  UserCog,
  Volume2,
  Bell,
  Lock,
  Globe,
  Monitor,
  Save,
} from "lucide-react";
import { changePassword } from "../../service/userService";
import "./Setting.scss";

const { Option } = Select;

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const [settings, setSettings] = useState({
    language: "vi",
    theme: "light",
    notifications: true,
    emailUpdates: false,
    autoPlayAudio: true,
    defaultVoice: "vi-VN-HoaiMyNeural",
    readingSpeed: 1.0,
    fontSize: 16,
  });

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    localStorage.setItem("appSettings", JSON.stringify({ ...settings, [key]: value }));
    message.success("Đã lưu cài đặt");
  };

  const handleChangePassword = async (values) => {
    setLoading(true);
    try {
      const res = await changePassword(values);
      if (res.success) {
        message.success("Đổi mật khẩu thành công!");
        form.resetFields();
      } else {
        message.error(res.error || "Đổi mật khẩu thất bại");
      }
    } catch (error) {
      message.error("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  const items = [
    {
      key: "1",
      label: (
        <span className="tab-label">
          <Monitor size={18} /> Chung
        </span>
      ),
      children: (
        <div className="settings-section">
          <div className="setting-item">
            <div className="info">
              <h4>Ngôn ngữ ứng dụng</h4>
              <p>Chọn ngôn ngữ hiển thị cho giao diện</p>
            </div>
            <Select
              value={settings.language}
              style={{ width: 150 }}
              onChange={(val) => handleSettingChange("language", val)}
            >
              <Option value="vi">Tiếng Việt 🇻🇳</Option>
              <Option value="en">English 🇺🇸</Option>
            </Select>
          </div>
          <Divider />
          <div className="setting-item">
            <div className="info">
              <h4>Thông báo đẩy</h4>
              <p>Nhận thông báo về tin nhắn và tương tác mới</p>
            </div>
            <Switch
              checked={settings.notifications}
              onChange={(val) => handleSettingChange("notifications", val)}
            />
          </div>
          <Divider />
          <div className="setting-item">
            <div className="info">
              <h4>Email cập nhật</h4>
              <p>Nhận email về các tính năng mới và khuyến mãi</p>
            </div>
            <Switch
              checked={settings.emailUpdates}
              onChange={(val) => handleSettingChange("emailUpdates", val)}
            />
          </div>
        </div>
      ),
    },
    {
      key: "2",
      label: (
        <span className="tab-label">
          <Volume2 size={18} /> Trải nghiệm Đọc & AI
        </span>
      ),
      children: (
        <div className="settings-section">
          <div className="setting-item">
            <div className="info">
              <h4>Tự động phát Audio</h4>
              <p>Tự động đọc truyện khi mở trang mới</p>
            </div>
            <Switch
              checked={settings.autoPlayAudio}
              onChange={(val) => handleSettingChange("autoPlayAudio", val)}
            />
          </div>
          <Divider />
          <div className="setting-item">
            <div className="info">
              <h4>Giọng đọc mặc định (AI Voice)</h4>
              <p>Giọng đọc ưu tiên khi tạo truyện mới</p>
            </div>
            <Select
              value={settings.defaultVoice}
              style={{ width: 220 }}
              onChange={(val) => handleSettingChange("defaultVoice", val)}
            >
              <Option value="vi-VN-HoaiMyNeural">Hoài My (Nữ - Bắc)</Option>
              <Option value="vi-VN-NamMinhNeural">Nam Minh (Nam - Bắc)</Option>
              <Option value="vi-VN-ThanhXuanNeural">Thanh Xuân (Nữ - Nhẹ)</Option>
            </Select>
          </div>
          <Divider />
          <div className="setting-item">
            <div className="info">
              <h4>Tốc độ đọc</h4>
              <p>Điều chỉnh tốc độ giọng đọc AI ({settings.readingSpeed}x)</p>
            </div>
            <div style={{ width: 200 }}>
              <Slider
                min={0.5}
                max={2.0}
                step={0.1}
                value={settings.readingSpeed}
                onChange={(val) => handleSettingChange("readingSpeed", val)}
                tooltip={{ formatter: (value) => `${value}x` }}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "3",
      label: (
        <span className="tab-label">
          <Lock size={18} /> Bảo mật
        </span>
      ),
      children: (
        <div className="settings-section security-section">
          <h3>Đổi mật khẩu</h3>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleChangePassword}
            className="password-form"
          >
            <Form.Item
              name="currentPassword"
              label="Mật khẩu hiện tại"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu hiện tại" },
              ]}
            >
              <Input.Password placeholder="Nhập mật khẩu cũ" />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label="Mật khẩu mới"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu mới" },
                { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
              ]}
            >
              <Input.Password placeholder="Nhập mật khẩu mới" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Xác nhận mật khẩu mới"
              dependencies={["newPassword"]}
              rules={[
                { required: true, message: "Vui lòng xác nhận mật khẩu" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("Hai mật khẩu không khớp!")
                    );
                  },
                }),
              ]}
            >
              <Input.Password placeholder="Nhập lại mật khẩu mới" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={<Save size={16} />}
                loading={loading}
                className="save-pass-btn"
              >
                Cập nhật mật khẩu
              </Button>
            </Form.Item>
          </Form>
        </div>
      ),
    },
  ];

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h2>Cài Đặt Hệ Thống</h2>
        <p>Quản lý tùy chọn ứng dụng và tài khoản của bạn</p>
      </div>

      <div className="settings-container">
        <Tabs defaultActiveKey="1" items={items} tabPosition="left" className="settings-tabs" />
      </div>
    </div>
  );
};

export default Settings;