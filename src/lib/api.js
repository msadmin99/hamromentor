const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

function getTokens() {
  if (typeof window === "undefined") return {};
  return {
    access: window.localStorage.getItem("hm_access"),
    refresh: window.localStorage.getItem("hm_refresh"),
  };
}

export function setTokens({ access, refresh }) {
  if (typeof window === "undefined") return;
  if (access) window.localStorage.setItem("hm_access", access);
  if (refresh) window.localStorage.setItem("hm_refresh", refresh);
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("hm_access");
  window.localStorage.removeItem("hm_refresh");
}

export function getDeviceId() {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem("hm_device_id");
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem("hm_device_id", id);
  }
  return id;
}

async function refreshAccessToken() {
  const { refresh } = getTokens();
  if (!refresh) return null;
  const res = await fetch(`${API_URL}/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) {
    clearTokens();
    return null;
  }
  const data = await res.json();
  setTokens({ access: data.access });
  return data.access;
}

export async function apiFetch(path, { method = "GET", body, auth = true, isRetry = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const { access } = getTokens();
    if (access) headers.Authorization = `Bearer ${access}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth && !isRetry) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      return apiFetch(path, { method, body, auth, isRetry: true });
    }
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message = data?.detail || data?.non_field_errors?.[0] || summarizeErrors(data) || "Something went wrong.";
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

function summarizeErrors(data) {
  if (!data || typeof data !== "object") return null;
  const firstKey = Object.keys(data)[0];
  if (!firstKey) return null;
  const value = data[firstKey];
  const message = Array.isArray(value) ? value[0] : value;
  return `${firstKey}: ${message}`;
}

export async function uploadFields(path, method, fields) {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value);
  });
  const headers = {};
  const { access } = getTokens();
  if (access) headers.Authorization = `Bearer ${access}`;

  const res = await fetch(`${API_URL}${path}`, { method, headers, body: formData });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const message = data?.detail || summarizeErrors(data) || "Upload failed.";
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const api = {
  get: (path, opts) => apiFetch(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => apiFetch(path, { ...opts, method: "POST", body }),
  patch: (path, body, opts) => apiFetch(path, { ...opts, method: "PATCH", body }),
  del: (path, opts) => apiFetch(path, { ...opts, method: "DELETE" }),
};

export { API_URL };
