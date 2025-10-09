import React, { useState } from "react";
import Swal from "sweetalert2";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { Modal, Input, Button, Spin } from "antd";
import { sendOtp, verifyOtp } from "@/service/authService";
import "./Signup.scss";

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [otp, setOtp] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword } = formData;

    if (password !== confirmPassword) {
      toast.error("Mật khẩu không khớp!");
      return;
    }

    try {
      setLoading(true);
      const res = await sendOtp({ name, email, password });
      if (res.success) {
        toast.success("Đã gửi mã OTP tới email của bạn!");
        setIsModalVisible(true);
      } else if (res.message === "User already exists") {
        toast.error("Email đã được sử dụng!");
      } else {
        toast.error(res.message || "Lỗi khi gửi OTP, vui lòng thử lại!");
      }
    } catch (err) {
      toast.error("Lỗi khi gửi OTP!");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      toast.error("Vui lòng nhập mã OTP!");
      return;
    }

    try {
      setLoading(true);
      const res = await verifyOtp({ ...formData, otp });

      if (res.success) {
        setIsModalVisible(false);
        Swal.fire({
          title: "Đăng ký thành công!",
          text: "Bạn có thể đăng nhập ngay bây giờ.",
          icon: "success",
          confirmButtonText: "Đăng nhập",
        }).then(() => navigate("/login"));
      } else {
        toast.error(res.message || "Mã OTP không đúng hoặc đã hết hạn!");
      }
    } catch (err) {
      toast.error("Không thể xác minh OTP!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <ToastContainer position="top-right" autoClose={2000} />
      <div className="signup-card">
        <h2>Tạo tài khoản</h2>

        <form onSubmit={handleSendOtp}>
          <div className="form-group">
            <label>Họ tên</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Xác nhận mật khẩu</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? <Spin size="small" /> : "Đăng ký"}
          </button>
        </form>

        <div className="extra-links">
          <p>
            Đã có tài khoản?{" "}
            <a href="/login" className="signin-link">
              Đăng nhập
            </a>
          </p>
        </div>
      </div>

      <Modal
        title="Xác thực email"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        centered
      >
        <p>Chúng tôi đã gửi mã OTP đến email của bạn.</p>
        <Input
          placeholder="Nhập mã OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          style={{ marginBottom: "15px", textAlign: "center" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Button onClick={() => setIsModalVisible(false)}>Hủy</Button>
          <Button
            type="primary"
            loading={loading}
            onClick={handleVerifyOtp}
            style={{ backgroundColor: "#6c086c", borderColor: "#6c086c" }}
          >
            Xác nhận
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Signup;