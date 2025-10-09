const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  logout,
  refreshToken,
  getProfile,
  changePassword,
  updateProfile,
  sendOtp,
  verifyOtpAndSignup
} = require('../controllers/auth.controller.js');
const { auth } = require('../middleware/auth.middleware.js');

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', auth, logout);
router.post('/refresh-token', refreshToken);
router.get('/profile', auth, getProfile);
router.post('/change-password', auth, changePassword);
router.put('/update-profile', auth, updateProfile);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtpAndSignup);

module.exports = router;