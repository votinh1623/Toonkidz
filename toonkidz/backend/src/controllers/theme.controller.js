//theme.controller.js
import themes from "../config/theme.config.js";

// Helper: pick n random elements from an array
function getRandom(arr, n = 3) {
  return arr
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, n)
    .map(obj => obj.value);
}

/**
 * GET /api/themes/:theme/words
 * Returns 3 random words per difficulty level
 * in BOTH Vietnamese (vi) and English (en)
 */
export const getThemeWords = (req, res) => {
  const theme = req.params.theme;
  const themeData = themes[theme];

  if (!themeData) {
    return res.status(404).json({ error: "Theme not found" });
  }

  // pick 3 random words per difficulty
  const words = {
    easy: getRandom(themeData.easy),
    medium: getRandom(themeData.medium),
    hard: getRandom(themeData.hard)
  };

  // separate into vietnamese & english
  const vietnamese = {
    easy: words.easy.map(w => w.vi),
    medium: words.medium.map(w => w.vi),
    hard: words.hard.map(w => w.vi)
  };

  const english = {
    easy: words.easy.map(w => w.en),
    medium: words.medium.map(w => w.en),
    hard: words.hard.map(w => w.en)
  };

  res.json({
    theme,
    words: {
      vietnamese,  // for story generation
      english      // for image generation
    }
  });
};
