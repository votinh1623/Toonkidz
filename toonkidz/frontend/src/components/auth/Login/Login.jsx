import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api.js';
import "./Login.scss";
import Swal from 'sweetalert2/dist/sweetalert2.js'
import 'sweetalert2/src/sweetalert2.scss'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // setError('');
    // setLoading(true);
    // try {
    //   const response = await api.post('/auth/login', {
    //     email: formData.email,
    //     password: formData.password
    //   });

    //   if (response.status === 200) {
    //     navigate('/home');
    //   }
    // } catch (err) {
    //   setError(err.response?.data?.message || 'Login failed');
    // } finally {
    //   setLoading(false);
    // }
    Swal.fire({
      title: "Login Successfully!",
      icon: "success",
      draggable: true
    });
    navigate("/home/homepage")
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Welcome Back</h2>

        {error && <div className="error-message">{error}</div>}

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
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="forgot-password">
          <a href="#">Forgot password?</a>
        </div>

        <div className="signup-link">
          <p>
            Don't have an account? <a href="/signup">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
