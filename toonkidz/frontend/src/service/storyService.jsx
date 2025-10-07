// src/service/storyService.js
import { postFormData } from "@/utils/request";

export const createStory = async (formData) => {
  try {
    const res = await postFormData("api/story/create", formData);
    return res;
  } catch (err) {
    console.error("Error creating story:", err);
    throw err;
  }
};