const AUTH_KEY = "vx_auth";

export function saveAuth(payload) {
  const expiresAt = Date.now() + Number(payload.expiresIn ?? 0); // expiresIn is ms in your response
  const auth = {
    accessToken: payload.accessToken,
    tokenType: payload.tokenType ?? "Bearer",
    expiresIn: payload.expiresIn,
    expiresAt,
    user: payload.user, // keep as-is for now
  };
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  return auth;
}

export function getAuth() {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

export function isLoggedIn() {
  const auth = getAuth();
  if (!auth?.accessToken) return false;
  if (!auth?.expiresAt) return true; // fallback
  return Date.now() < auth.expiresAt;
}

export function getAuthHeader() {
  const auth = getAuth();
  if (!auth?.accessToken) return {};
  return { Authorization: `${auth.tokenType || "Bearer"} ${auth.accessToken}` };
}
export function getRoleKey(auth = getAuth()) {
  const raw =
    auth?.user?.role ||
    auth?.user?.roles?.[0] ||
    auth?.role ||
    auth?.roles?.[0] ||
    "";

  const r = String(raw).trim().toUpperCase();

  if (r.includes("SYSTEM")) return "SYSTEM_ADMIN";
  if (r.includes("DEPT") || r.includes("DEPARTMENT")) return "DEPT_ADMIN";

  return r;
}

export function canCreateMasterData(auth = getAuth()) {
  return getRoleKey(auth) === "SYSTEM_ADMIN";
}
