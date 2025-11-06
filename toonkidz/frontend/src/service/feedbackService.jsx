// src/service/feedbackService.js
import { get, post } from "@/utils/request";

export const postGuestFeedback = async (data) => {
  return post(`feedback/guest`, data);
};

export const getAllFeedback = async () => {
  return get(`feedback/admin`);
};

export const replyToFeedback = async (id, replyContent) => {
  return post(`feedback/admin/${id}/reply`, { replyContent });
};