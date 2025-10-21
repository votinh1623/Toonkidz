// backend/src/controllers/auth.controller.js
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import redis from "../lib/redis.js";
import nodemailer from "nodemailer";

// --- CÁC HÀM HELPERS (giữ nguyên) ---
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
  return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
  await redis.set(`refresh_token:${userId}`, refreshToken, "EX", 7 * 24 * 60 * 60);
};

const setCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 6000 * 60 * 1000, //set access time
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await user.comparePassword(password))) {
      const { accessToken, refreshToken } = generateTokens(user._id);
      await storeRefreshToken(user._id, refreshToken);
      setCookies(res, accessToken, refreshToken);
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
      return res.status(401).json({ message: "No refresh token provided" });
    }
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const storedToken = await redis.get(`refresh_token:${decoded.userId}`);
    if (storedToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    const accessToken = jwt.sign({ userId: decoded.userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });
    res.json({ message: "Token refreshed successfully" });
  } catch (error) {
    console.log("Error in refreshToken controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const sendOtp = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: "Email already registered" });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const key = `otp:${email.toLowerCase()}`;
    await redis.set(key, otp, "EX", 300);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Toonkidz" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Mã xác thực đăng ký (OTP)",
      text: `Mã OTP của bạn là: ${otp} (hết hạn sau 5 phút)`,
    });

    res.status(200).json({
      success: true,
      message: "OTP sent successfully"
    });
  } catch (error) {
    console.error("Error sending OTP:", error.message);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

export const verifyOtpAndSignup = async (req, res) => {
  const { email, name, password, otp } = req.body;
  try {
    if (!email || !name || !password || !otp) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    const key = `otp:${email.toLowerCase()}`;
    const storedOtp = await redis.get(key);

    if (!storedOtp) {
      return res.status(400).json({ success: false, message: "OTP expired or invalid" });
    }
    if (storedOtp.trim() !== otp.trim()) {
      return res.status(400).json({ success: false, message: "Incorrect OTP" });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
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