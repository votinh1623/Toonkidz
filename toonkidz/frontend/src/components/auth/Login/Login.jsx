import React, { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { login } from "@/service/authService";
import Swal from "sweetalert2";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import "./Login.scss";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await login({
        email: formData.email,
        password: formData.password,
      });

      if (res._id) {
        Swal.fire({
          title: "Đăng nhập thành công!",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
        navigate("/home/homepage");
      } else {
        Swal.fire({
          title: "Đăng nhập thất bại",
          text: res.message || "Sai email hoặc mật khẩu",
          icon: "error",
        });
      }
    } catch (err) {
      Swal.fire({
        title: "Lỗi kết nối máy chủ!",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Welcome Back</h2>
        <p className="login-subtitle">Đăng nhập để tiếp tục khám phá thế giới truyện</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
              <span
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeTwoTone twoToneColor="#a663cc" />
                ) : (
                  <EyeInvisibleOutlined style={{ color: "#a663cc" }} />
                )}
              </span>
            </div>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="signup-link">
          <span>Chưa có tài khoản? </span>
          <NavLink to="/signup">Đăng ký ngay</NavLink>
        </div>
      </div>
    </div>
  );
};

export default Login;