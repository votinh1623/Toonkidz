import { get } from "@/utils/request";

export const getDashboardStats = async (range = 7) => {
  try {
    const res = await get(`admin/stats?range=${range}`);
    return res;
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    throw err;
  }
};