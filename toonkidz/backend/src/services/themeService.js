// backend/services/themeService.js
const themes = require("../config/theme.config");

function pickRandom(arr, n) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

class ThemeService {
  static getNineWords(theme) {
    if (!themes[theme]) throw new Error(`Theme "${theme}" not found`);
    const { easy, medium, hard } = themes[theme];

    if (easy.length < 3 || medium.length < 3 || hard.length < 3) {
      throw new Error(`Not enough words in theme "${theme}"`);
    }

    return {
      easy:   pickRandom(easy, 3),
      medium: pickRandom(medium, 3),
      hard:   pickRandom(hard, 3)
    };
  }
}

module.exports = ThemeService;
