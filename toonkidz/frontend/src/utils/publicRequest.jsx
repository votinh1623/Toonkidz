const API_DOMAIN = "http://localhost:3000/api";

const buildUrl = (path) =>
  `${API_DOMAIN.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

export const getPublic = async (path) => {
  const res = await fetch(buildUrl(path));
  return res.json();
};

export const postPublic = async (path, data) => {
  const res = await fetch(buildUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return res.json();
};

export const delPublic = async (path) => {
  const res = await fetch(buildUrl(path), { method: "DELETE" });
  return res.json();
};

export const patchPublic = async (path, data) => {
  const res = await fetch(buildUrl(path), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return res.json();
};

export const postFormDataPublic = async (path, formData) => {
  const res = await fetch(buildUrl(path), {
    method: "POST",
    body: formData,
  });
  return res.json();
};

export const patchFormDataPublic = async (path, formData) => {
  const res = await fetch(buildUrl(path), {
    method: "PATCH",
    body: formData,
  });
  return res.json();
};