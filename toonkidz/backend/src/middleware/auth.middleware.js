//auth.middleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/user.model.js');
const auth = async (req, res, next) => {
  try {
    // Try to get token from cookie first
    let token = req.cookies.accessToken;

    // If not in cookie, try Authorization header (for backward compatibility)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
      }
      token = authHeader.split(' ')[1];
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid token.' });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Optional: Admin middleware for admin-only routes
const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
      }
      next();
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

module.exports = { auth, adminAuth };