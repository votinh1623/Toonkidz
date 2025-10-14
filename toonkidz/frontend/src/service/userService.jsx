// src/service/userService.js
import { get, post } from "@/utils/request";

export const toggleFavorite = async (storyId) => {
  try {
    const res = await post(`user/toggle-favorite/${storyId}`);
    return res;
  } catch (err) {
    console.error("Error toggling favorite:", err);
    throw err;
  }
};

export const getFavorites = async () => {
  try {
    const res = await get('user/favorites');
    return res;
  } catch (err) {
    console.error("Error fetching favorites:", err);
    throw err;
  }
};