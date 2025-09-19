// backend/controllers/themeController.js
const ThemeService = require('../services/themeService');

exports.getNineWords = (req, res) => {
  try {
    const { theme } = req.params; // /api/themes/fairytale
    const words = ThemeService.getNineWords(theme);
    res.json({ theme, words });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
