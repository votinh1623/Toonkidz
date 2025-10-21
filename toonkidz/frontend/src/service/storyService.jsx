// src/service/storyService.js
import { get, del, postFormData, putFormData } from "@/utils/request";

export const getStories = async (
  page = 1,
  limit = 10,
  search = "",
  status,
  theme
) => {
  try {
    const params = {
      page,
      limit,
      search,
    };
    if (status) {
      params.status = status;
    }
    if (theme) {
      params.theme = theme;
    }
    const queryParams = new URLSearchParams(params).toString();
    const res = await get(`stories?${queryParams}`);
    return res;
  } catch (err) {
    console.error("Error fetching stories:", err);
    throw err;
  }
};

export const getStoryById = async (storyId) => {
  try {
    const res = await get(`stories/${storyId}`);
    return res;
  } catch (err) {
    console.error(`Error fetching story with ID ${storyId}:`, err);
    throw err;
  }
};

export const createStory = async (formData) => {
  try {
    const res = await postFormData("stories/create", formData);
    return res;
  } catch (err) {
    console.error("Error creating story:", err);
    throw err;
  }
};

export const updateStory = async (storyId, formData) => {
  try {
    const res = await putFormData(`stories/${storyId}`, formData);
    return res;
  } catch (err) {
    console.error(`Error updating story with ID ${storyId}:`, err);
    throw err;
  }
};

export const deleteStoryById = async (storyId) => {
  try {
    const res = await del(`stories/${storyId}`);
    return res;
  } catch (err) {
    console.error(`Error deleting story with ID ${storyId}:`, err);
    throw err;
  }
};

export const getMyStories = async () => {
  try {
    const res = await get(`stories/my-stories`);
    return res;
  } catch (err) {
    console.error("Error fetching my stories:", err);
    throw err;
  }
};

export const getPublicStories = async (filters = {}) => {
  try {
    const params = new URLSearchParams({
      page: filters.page || 1,
      limit: filters.limit || 12,
    });
    if (filters.search) params.append('search', filters.search);
    if (filters.theme) params.append('theme', filters.theme);
    if (filters.ageGroup) params.append('ageGroup', filters.ageGroup);

    const res = await get(`stories/public?${params.toString()}`);
    return res;
  } catch (err) {
    console.error("Error fetching public stories:", err);
    throw err;
  }
};