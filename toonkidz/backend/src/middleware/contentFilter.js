//middleware/contentFilter.js
const BLOCKED_KEYWORDS = [
  'violence', 'weapon', 'kill', 'death', 'blood', 'gore',
  'scary', 'horror', 'frightening', 'monster', 'ghost',
  'adult', 'inappropriate', 'sexy', 'nude', 'drugs',
  'alcohol', 'smoking', 'fight', 'war', 'crime'
];

const contentFilter = (req, res, next) => {
  const { prompt } = req.body;

  if (!prompt) return next();

  // Check for blocked keywords
  const lowerPrompt = prompt.toLowerCase();
  const foundKeyword = BLOCKED_KEYWORDS.find(keyword =>
    lowerPrompt.includes(keyword)
  );

  if (foundKeyword) {
    return res.status(400).json({
      error: 'Inappropriate content detected',
      message: 'Please use child-friendly language in your prompts'
    });
  }

  next();
};

module.exports = contentFilter;