import { postPublic } from "@/utils/publicRequest";
import { get, post } from "@/utils/request";
import { putFormData } from "../utils/request";

export const login = async (userData) => {
  return await postPublic(`auth/login`, userData);
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

export const sendResetOtp = async (data) => {
  return await postPublic('auth/send-reset-otp', data);
};

export const verifyResetOtp = async (data) => {
  return await postPublic('auth/verify-reset-otp', data);
};

export const resetPassword = async (data) => {
  return await postPublic('auth/reset-password', data);
};
