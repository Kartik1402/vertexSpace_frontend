const DEFAULT_API_BASE_URL = "http://localhost:8080";

const envBaseUrl = import.meta.env.VITE_API_BASE_URL;

export const API_BASE_URL = (envBaseUrl || DEFAULT_API_BASE_URL).replace(/\/+$/, "");

export function apiUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;

  const normalizedPath = String(path || "").startsWith("/") ? String(path || "") : `/${String(path || "")}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
