// Request
const API_DOMAIN = `http://localhost:3000/`;

const FIXED_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGQ1Mjc2N2QwNGNlOGQ0YTBiMzJlMmYiLCJpYXQiOjE3NTk4MzkyMTksImV4cCI6MTc1OTg0MDExOX0.atkdwxKilbGCN7sPcp0O9dD7_ch1r2WloGRIFb03rEc";

// Hàm lấy token từ localStorage
const getAuthHeaders = () => {
  return {
    Authorization: `Bearer ${FIXED_TOKEN}`,
  };
};

export const get = async (path) => {
  const response = await fetch(API_DOMAIN + path, {
    headers: {
      ...getAuthHeaders() // gắn token nếu có
    }
  });
  const result = await response.json();
  return result;
};

export const post = async (path, data) => {
  const response = await fetch(API_DOMAIN + path, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  return result;
};

export const del = async (path) => {
  const response = await fetch(API_DOMAIN + path, {
    method: "DELETE",
    headers: {
      ...getAuthHeaders()
    }
  });
  const result = await response.json();
  return result;
};

export const patch = async (path, data) => {
  const response = await fetch(API_DOMAIN + path, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  return result;
};

export const postFormData = async (path, formData) => {
  const response = await fetch(API_DOMAIN + path, {
    method: "POST",
    headers: {
      ...getAuthHeaders()
    },
    body: formData,
    credentials: "include", // gửi cookie kèm theo
  });
  return await response.json();
};

export const patchFormData = async (path, formData) => {
  const response = await fetch(API_DOMAIN + path, {
    method: "PATCH",
    headers: {
      ...getAuthHeaders() // Không set Content-Type
    },
    body: formData
  });
  return await response.json();
};
