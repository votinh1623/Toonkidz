// src/service/locationService.js
const API_URL = "https://provinces.open-api.vn/api/p/";

export const getProvinces = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch provinces');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching provinces:", error);
    return [];
  }
};