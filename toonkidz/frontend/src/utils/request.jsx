//src/utils/request
const API_DOMAIN = "http://localhost:3000/api";

const buildUrl = (path) =>
  `${API_DOMAIN.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

// Nếu dùng cookie-based auth:
const getAuthHeaders = () => ({});

export const get = async (path) => {
  const res = await fetch(buildUrl(path), {
    method: "GET",
    credentials: "include",
  });
  return res.json();
};

export const post = async (path, data) => {
  const res = await fetch(buildUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  return res.json();
};

export const put = async (path, data) => {
  const res = await fetch(buildUrl(path), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  return res.json();
};

export const del = async (path) => {
  const res = await fetch(buildUrl(path), {
    method: "DELETE",
    credentials: "include",
  });
  return res.json();
};

export const patch = async (path, data) => {
  const res = await fetch(buildUrl(path), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
    credentials: "include",
  });
  return res.json();
};

export const postFormData = async (path, formData) => {
  const res = await fetch(buildUrl(path), {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  return res.json();
};

export const putFormData = async (path, formData) => {
  const res = await fetch(buildUrl(path), {
    method: "PUT", // Sử dụng method PUT
    body: formData,
    credentials: "include",
  });
  return res.json();
};

export const patchFormData = async (path, formData) => {
  const res = await fetch(buildUrl(path), {
    method: "PATCH",
    body: formData,
    credentials: "include",
  });
  return res.json();
};