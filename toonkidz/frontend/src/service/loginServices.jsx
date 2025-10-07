import { postPublic } from "@/utils/publicRequest";


export const login = async (userData) => {
  const response = await postPublic(`auth/token`, userData);
  return response;
}