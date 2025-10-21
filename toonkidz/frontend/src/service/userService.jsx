// src/service/userService.js
import { get, post } from "@/utils/request";
import { putFormData } from "../utils/request";

export const toggleFavorite = async (storyId) => {
  try {
    const res = await post(`users/toggle-favorite/${storyId}`);
    return res;
  } catch (err) {
    console.error("Error toggling favorite:", err);
    throw err;
  }
};

export const getFavorites = async () => {
  try {
    const res = await get('users/favorites');
    return res;
  } catch (err) {
    console.error("Error fetching favorites:", err);
    throw err;
  }
};

export const getUserById = async (userId) => {
  return get(`users/${userId}`);
};

export const followUser = async (userId) => {
  return post(`users/${userId}/follow`);
};


export const updateProfile = async (formData) => {
  return putFormData(`users/profile`, formData);
};

export const changePassword = async (data) => {
  return post(`users/change-password`, data);
};

export const getProfile = async () => {
  return await get(`users/profile`);
};