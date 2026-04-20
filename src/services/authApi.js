import { apiUrl } from "./config";

async function readError(res) {
  // tries JSON first, then text
  try {
    const data = await res.json();
    return data?.message || data?.error || JSON.stringify(data);
  } catch {
    try {
      const text = await res.text();
      return text || `Request failed (${res.status})`;
    } catch {
      return `Request failed (${res.status})`;
    }
  }
}

export async function login(email, password) {
  const res = await fetch(apiUrl("/api/v1/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const message = await readError(res);
    // common cases: 401 invalid credentials, 400 validation
    throw new Error(message || "Login failed");
  }

  return res.json(); // matches your response structure
}
export async function register({ email, password, displayName, code }) {
  const res = await fetch(apiUrl("/api/v1/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, displayName, code }),
  });

  if (!res.ok) throw new Error(await readError(res)); // handles 409 duplicate message
  return res.json(); // returns accessToken/tokenType/expiresIn/user
}
