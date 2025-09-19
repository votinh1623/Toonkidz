// routes/themes.js
const express = require('express');
const router = express.Router();
const themes = require('../config/theme.config');

router.get('/:theme/words', (req, res) => {
  const theme = req.params.theme;
  if (!themes[theme]) return res.status(404).json({ error: 'Theme not found' });

  // Pick 3 random words from each level
  const getRandom = (arr) => arr.sort(() => 0.5 - Math.random()).slice(0, 3);

  const words = {
    easy: getRandom(themes[theme].easy),
    medium: getRandom(themes[theme].medium),
    hard: getRandom(themes[theme].hard),
  };

  res.json({ theme, words });
});

module.exports = router;
