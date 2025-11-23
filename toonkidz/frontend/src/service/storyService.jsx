import { get, post, del, postFormData, putFormData, put } from "@/utils/request";
import { putPublic } from "../utils/publicRequest";

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
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.search) params.append('search', filters.search);
    if (filters.theme) params.append('theme', filters.theme);
    if (filters.ageGroup) params.append('ageGroup', filters.ageGroup);

    if (filters.sortBy) params.append('sortBy', filters.sortBy);

    const res = await get(`stories/public?${params.toString()}`);
    return res;
  } catch (err) {
    console.error("Error fetching public stories:", err);
    throw err;
  }
};

export const incrementStoryReadCount = async (storyId) => {
  return putPublic(`stories/${storyId}/read`);
};

export const getSystemStats = async () => {
  return get('stories/stats/system');
};

export const rateStory = async (storyId, rating) => {
  return await post(`stories/${storyId}/rate`, { rating });
};