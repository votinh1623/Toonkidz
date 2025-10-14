// backend/src/controllers/user.controller.js
import User from '../models/user.model.js';
import Story from '../models/story.model.js';


export const toggleFavoriteStory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { storyId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const storyIndex = user.favorites.indexOf(storyId);
    let message = "";

    if (storyIndex > -1) {
      user.favorites.splice(storyIndex, 1);
      message = "Đã xóa truyện khỏi danh sách yêu thích";
    } else {
      user.favorites.push(storyId);
      message = "Đã thêm truyện vào danh sách yêu thích";
    }

    await user.save();
    res.json({ success: true, message, favorites: user.favorites });

  } catch (error) {
    console.error("Error toggling favorite:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const getFavoriteStories = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate({
      path: 'favorites',
      model: Story
    });
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    res.json({ success: true, stories: user.favorites });
  } catch (error) {
    console.error("Error fetching favorite stories:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};