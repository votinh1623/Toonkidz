// src/service/dashboardService.js
import { get } from "@/utils/request";

export const getDashboardStats = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await get(`admin/stats?${query}`);
    return res;
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    throw err;
  }
};