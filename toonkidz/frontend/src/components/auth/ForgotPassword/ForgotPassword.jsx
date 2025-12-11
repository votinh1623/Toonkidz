import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendResetOtp, verifyResetOtp, resetPassword } from '@/service/authService';
import { message } from 'antd';
import './ForgotPassword.scss';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [verified, setVerified] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [otpError, setOtpError] = useState('');
    const navigate = useNavigate();

    const handleSendOtp = async () => {
        if (!email) return message.error('Nhập email');
        setLoading(true);
        try {
            const res = await sendResetOtp({ email });
            if (res && res.success) {
                message.success('Mã OTP đã được gửi tới email của bạn');
                setOtpSent(true);
            } else {
                message.error(res.message || 'Không thể gửi OTP');
            }
        } catch (err) {
            message.error('Lỗi gửi OTP');
        } finally { setLoading(false); }
    };

    const handleVerifyOtp = async () => {
        if (!otp) return message.error('Nhập mã OTP');
        setLoading(true);
        setOtpError('');
        try {
            const res = await verifyResetOtp({ email, otp });
            if (res && res.success) {
                message.success('OTP hợp lệ. Bạn có thể đặt mật khẩu mới.');
                setVerified(true);
            } else {
                setOtpError('Mã OTP không hợp lệ. Vui lòng kiểm tra lại email và nhập đúng mã.');
                message.error(res.message || 'OTP không hợp lệ');
            }
        } catch (err) {
            setOtpError('Lỗi xác thực OTP. Vui lòng thử lại.');
            message.error('Lỗi xác thực OTP');
        } finally { setLoading(false); }
    };

    const handleReset = async () => {
        if (!newPassword) return message.error('Nhập mật khẩu mới');
        if (newPassword !== confirmPassword) return message.error('Mật khẩu không khớp');
        setLoading(true);
        try {
            const res = await resetPassword({ email, otp, newPassword });
            if (res && res.success) {
                message.success('Đặt lại mật khẩu thành công. Về trang đăng nhập...');
                setTimeout(() => navigate('/login'), 1200);
            } else {
                message.error(res.message || 'Không thể đặt lại mật khẩu');
            }
        } catch (err) {
            message.error('Lỗi đặt lại mật khẩu');
        } finally { setLoading(false); }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2>Quên mật khẩu</h2>
                <p className="login-subtitle">Nhập email đã đăng ký để nhận mã xác thực</p>

                <form onSubmit={(e) => { e.preventDefault(); if (!otpSent) { handleSendOtp(); } else if (!verified) { handleVerifyOtp(); } else { handleReset(); } }}>

                    {!otpSent && (
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Nhập email"
                                required
                            />
                        </div>
                    )}

                    {otpSent && !verified && (
                        <div className="form-group">
                            <label>Mã OTP</label>
                            <input
                                type="text"
                                name="otp"
                                value={otp}
                                onChange={(e) => {
                                    setOtp(e.target.value);
                                    setOtpError('');
                                }}
                                placeholder="Nhập mã OTP"
                                required
                            />
                            {otpError && <p style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '6px' }}>{otpError}</p>}
                        </div>
                    )}

                    {verified && (
                        <>
                            <div className="form-group">
                                <label>Mật khẩu mới</label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Mật khẩu mới"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Nhập lại mật khẩu</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Nhập lại mật khẩu"
                                    required
                                />
                            </div>
                        </>
                    )}

                    <button type="submit" disabled={loading}>
                        {loading ? (otpSent && !verified ? 'Processing...' : 'Processing...') : (!otpSent ? 'Gửi mã OTP' : (!verified ? 'Xác thực OTP' : 'Đặt lại mật khẩu'))}
                    </button>
                </form>

                <div className="signup-link" style={{ marginTop: 12 }}>
                    <span>Quay lại: </span>
                    <a href="/login">Đăng nhập</a>
                </div>

            </div>
        </div>
    );
};

export default ForgotPassword;
