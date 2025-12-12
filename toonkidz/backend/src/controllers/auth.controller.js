import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import redis from "../lib/redis.js";
import nodemailer from "nodemailer";

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "2h",
  });
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
  console.log("Tokens generated:", { accessToken: accessToken.substring(0, 20) + "...", userId });
  return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
  await redis.set(`refresh_token:${userId}`, refreshToken, "EX", 7 * 24 * 60 * 60);
};

const setCookies = (res, accessToken, refreshToken) => {
  console.log("Setting cookies...");
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 2 * 60 * 60 * 1000,
    path: "/",
  });
  console.log("accessToken cookie set");
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
  console.log("refreshToken cookie set");
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email ? email.trim().toLowerCase() : "";

    const user = await User.findOne({ email: normalizedEmail });

    if (user && (await user.comparePassword(password))) {
      if (!user.isActive) {
        return res.status(403).json({ message: "Tài khoản của bạn đã bị vô hiệu hóa." });
      }

      const { accessToken, refreshToken } = generateTokens(user._id);
      await storeRefreshToken(user._id, refreshToken);
      setCookies(res, accessToken, refreshToken);

      user.lastOnline = new Date();
      await user.save();

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastOnline: user.lastOnline,
        pfp: user.pfp,
      });
    } else {
      res.status(400).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      await redis.del(`refresh_token:${decoded.userId}`);
    }
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { lastOnline: new Date() });
    }
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided", success: false });
    }
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const storedToken = await redis.get(`refresh_token:${decoded.userId}`);
    if (storedToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token", success: false });
    }
    const newAccessToken = jwt.sign({ userId: decoded.userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "2h" });
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 2 * 60 * 60 * 1000,
      path: "/",
    });
    res.json({ message: "Token refreshed successfully", success: true, accessToken: newAccessToken });
  } catch (error) {
    console.log("Error in refreshToken controller", error.message);
    res.status(401).json({ message: "Invalid or expired refresh token", success: false });
  }
};

export const sendOtp = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      console.log(`[SendOTP] Email ${normalizedEmail} already registered.`);
      return res.status(400).json({ message: "Email already registered" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const key = `otp:${normalizedEmail}`;
    await redis.set(key, otp, "EX", 300);
    console.log("Stored OTP:", await redis.get(key));

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Toonkidz" <${process.env.EMAIL_USER}>`,
      to: normalizedEmail,
      subject: "Mã xác thực đăng ký (OTP)",
      text: `Mã OTP của bạn là: ${otp} (hết hạn sau 5 phút)`,
    });

    res.status(200).json({
      success: true,
      message: "OTP sent successfully"
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Failed to send OTP", error: error.message });
  }
};

export const verifyOtpAndSignup = async (req, res) => {
  const { email, name, password, otp } = req.body;
  console.log("Verify request body:", req.body);

  try {
    if (!email || !name || !password || !otp) {
      console.log("Missing fields");
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    const normalizedEmail = email.trim().toLowerCase();

    const key = `otp:${normalizedEmail}`;
    const storedOtp = await redis.get(key);
    console.log("Stored OTP in Redis:", storedOtp);
    console.log("Received OTP from frontend:", otp);

    if (!storedOtp) {
      console.log("OTP expired or invalid");
      return res.status(400).json({ success: false, message: "OTP expired or invalid" });
    }
    if (storedOtp.trim() !== otp.trim()) {
      console.log("OTP mismatch");
      return res.status(400).json({ success: false, message: "Incorrect OTP" });
    }

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
    });

    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);
    setCookies(res, accessToken, refreshToken);

    await redis.del(key);

    return res.status(201).json({
      success: true,
      message: "Signup successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({ success: false, message: "Signup failed" });
  }
};

export const sendResetOtp = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const key = `otp:reset:${normalizedEmail}`;
    await redis.set(key, otp, 'EX', 300);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: `"Toonkidz" <${process.env.EMAIL_USER}>`,
      to: normalizedEmail,
      subject: 'Mã OTP đặt lại mật khẩu',
      text: `Mã OTP của bạn để đặt lại mật khẩu là: ${otp} (hết hạn sau 5 phút)`,
    });

    return res.json({ success: true, message: 'OTP sent' });
  } catch (error) {
    console.error('Error in sendResetOtp', error.message);
    return res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

export const verifyResetOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Missing fields' });

    const normalizedEmail = email.trim().toLowerCase();
    const key = `otp:reset:${normalizedEmail}`;

    const stored = await redis.get(key);
    if (!stored) return res.status(400).json({ success: false, message: 'OTP expired or invalid' });
    if (stored.trim() !== otp.trim()) return res.status(400).json({ success: false, message: 'Incorrect OTP' });
    return res.json({ success: true, message: 'OTP verified' });
  } catch (error) {
    console.error('Error in verifyResetOtp', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    if (!email || !otp || !newPassword) return res.status(400).json({ success: false, message: 'Missing fields' });

    const normalizedEmail = email.trim().toLowerCase();
    const key = `otp:reset:${normalizedEmail}`;

    const stored = await redis.get(key);
    if (!stored) return res.status(400).json({ success: false, message: 'OTP expired or invalid' });
    if (stored.trim() !== otp.trim()) return res.status(400).json({ success: false, message: 'Incorrect OTP' });

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.password = newPassword;
    await user.save();
    await redis.del(key);

    return res.json({ success: true, message: 'Password updated' });
  } catch (error) {
    console.error('Error in resetPassword', error.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};