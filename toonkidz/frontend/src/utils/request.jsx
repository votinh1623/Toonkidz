// Request

const API_DOMAIN = `http://localhost:8081/`;

// Hàm lấy token từ localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
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
      ...getAuthHeaders() // Không set Content-Type, browser tự thêm boundary
    },
    body: formData
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
