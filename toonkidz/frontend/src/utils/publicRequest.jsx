// publicRequest.jsx
const API_DOMAIN = `http://localhost:8081/`;

// Không dùng getAuthHeaders vì đây là public API
export const getPublic = async (path) => {
  const response = await fetch(API_DOMAIN + path);
  const result = await response.json();
  return result;
};

export const postPublic = async (path, data) => {
  const response = await fetch(API_DOMAIN + path, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  return result;
};

export const delPublic = async (path) => {
  const response = await fetch(API_DOMAIN + path, { method: "DELETE" });
  const result = await response.json();
  return result;
};

export const patchPublic = async (path, data) => {
  const response = await fetch(API_DOMAIN + path, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  return result;
};

export const postFormDataPublic = async (path, formData) => {
  const response = await fetch(API_DOMAIN + path, {
    method: "POST",
    body: formData, // browser tự set Content-Type
  });
  return await response.json();
};

export const patchFormDataPublic = async (path, formData) => {
  const response = await fetch(API_DOMAIN + path, {
    method: "PATCH",
    body: formData, // browser tự set Content-Type
  });
  return await response.json();
};
