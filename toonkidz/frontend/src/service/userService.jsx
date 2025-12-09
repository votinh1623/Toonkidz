// src/service/userService.js
import { get, post } from "@/utils/request";
import { del, put, putFormData } from "../utils/request";

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

export const getAllUsers = async (page = 1, limit = 10, search = "", role = "") => {
  try {
    const params = new URLSearchParams({ page, limit, search });
    if (role) params.append('role', role);
    const res = await get(`users?${params.toString()}`);
    return res;
  } catch (err) {
    console.error("Error fetching users:", err);
    throw err;
  }
};

export const adminUpdateUser = async (userId, data) => {
  try {
    const res = await put(`users/${userId}`, data);
    return res;
  } catch (err) {
    console.error("Error updating user:", err);
    throw err;
  }
};

export const adminDeactivateUser = async (userId) => {
  try {
    const res = await del(`users/${userId}`);
    return res;
  } catch (err) {
    console.error("Error deactivating user:", err);
    throw err;
  }
};

export const toggleUserStatus = async (userId, isActive) => {
  try {
    const res = await put(`users/admin/${userId}/status`, { isActive });
    return res;
  } catch (error) {
    console.error("Error toggling user status:", error);
    throw error;
  }
};

export const searchUsers = async (page = 1, limit = 10, search = "") => {
  try {
    const params = new URLSearchParams({ page, limit, search });
    const res = await get(`users/search?${params.toString()}`);
    return res;
  } catch (err) {
    console.error("Error searching users:", err);
    throw err;
  }
};