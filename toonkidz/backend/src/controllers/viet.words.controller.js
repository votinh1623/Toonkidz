import { vietnameseThemes } from '../config/theme.vi.config.js';

export const getVietnameseWords = (req, res) => {
  const { theme } = req.params;
  const words = vietnameseThemes[theme];

  if (!words) {
    return res.status(404).json({ message: 'Theme not found' });
  }

  // Lấy ngẫu nhiên 7 từ
  const shuffled = [...words].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 7);

  res.json({ theme, words: selected });
};
