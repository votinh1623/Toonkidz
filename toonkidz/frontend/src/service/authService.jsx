import { postPublic } from "@/utils/publicRequest";
import { get, post } from "@/utils/request";

export const login = async (userData) => {
  return await postPublic(`auth/login`, userData);
};

export const getProfile = async () => {
  return await get(`auth/profile`);
};

export const logout = async () => {
  return await post(`auth/logout`, {});
};

export const sendOtp = async (data) => {
  return await postPublic("auth/send-otp", data);
};

export const verifyOtp = async (data) => {
  return await postPublic("auth/verify-otp", data);
};