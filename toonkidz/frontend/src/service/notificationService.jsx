// src/service/notificationService.js
import { get, post } from "@/utils/request";

export const getNotifications = async () => {
  return get('notifications');
};

export const markAllRead = async () => {
  return post('notifications/mark-all-read', {});
};

export const markOneRead = async (notificationId) => {
  return post(`notifications/${notificationId}/read`, {});
};