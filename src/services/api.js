import { getAuth } from "./authStorage";
import { apiUrl } from "./config";

export async function apiGet(path, { signal } = {}) {
  const auth = getAuth?.() ?? null;
  const token = auth?.accessToken;

  const res = await fetch(apiUrl(path), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = data?.message || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}
export async function apiDelete(path, { signal } = {}) {
  const auth = getAuth?.() ?? null;
  const token = auth?.accessToken;

  const res = await fetch(apiUrl(path), {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal,
  });

  // Many DELETEs return 204 No Content
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = data?.message || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data; // usually null for 204
}


export function getUpcomingBookings(opts) {
  return apiGet("/api/v1/bookings/my-bookings/upcoming", opts);
}

export function cancelBooking(id, opts) {
  return apiDelete(`/api/v1/bookings/${id}`, opts);
}
export function getPastBookings(opts) {
  return apiGet("/api/v1/bookings/my-bookings/past", opts);
}
export function getWaitlistEntries(opts) {
return apiGet("/api/v1/waitlist-entries", opts);
}

export function withdrawWaitlistEntryById(id, opts) {
  return apiDelete(`/api/v1/waitlist-entries/${id}`, opts);
}
export async function apiPost(path, body, { signal } = {}) {
  const auth = getAuth?.() ?? null;
  const token = auth?.accessToken;

  const res = await fetch(apiUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = data?.message || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export async function apiPatch(path, body, { signal, headers, credentials } = {}) {
  const auth = getAuth?.() ?? null;
  const token = auth?.accessToken;

  const url = apiUrl(path);

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
    ...(credentials ? { credentials } : {}),
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = data?.message || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export function getMyWaitlistOffer(opts) {
  return apiGet("/api/v1/me/waitlist-offers", opts);
}

export function acceptWaitlistOfferById(id, opts) {
  return apiPost(`/api/v1/waitlist-offers/${id}/accept`, undefined, opts);
}

export function declineWaitlistOfferById(id, opts) {
  return apiPost(`/api/v1/waitlist-offers/${id}/decline`, undefined, opts);
}
export function createBooking(payload, opts) {
  return apiPost("/api/v1/bookings", payload, opts);
}
export function createRecurringBooking(payload, opts) {
  return apiPost("/api/v1/bookings/recurring", payload, opts);
}
export async function patchAssignmentMode(resourceId, newMode) {
  const url = apiUrl(`/api/v1/resources/${resourceId}/assignment-mode?newMode=${encodeURIComponent(newMode)}`);

  const res = await fetch(url, {
    method: "PATCH",
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Failed to change assignment mode");
  }

  // If your backend returns updated resource JSON:
  return res.json();
}
export async function apiPut(path, body, { signal, headers, credentials } = {}) {
  const auth = getAuth?.() ?? null;
  const token = auth?.accessToken;

  const url = apiUrl(path);

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
    ...(credentials ? { credentials } : {}),
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = data?.message || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}
export function getAllFloors(opts) {
  return apiGet("/api/v1/floors", opts);
}

export function createFloor(payload, opts) {
  return apiPost("/api/v1/floors", payload, opts);
}

export function updateFloorById(id, payload, opts) {
  return apiPut(`/api/v1/floors/${id}`, payload, opts);
}

export function deleteFloorById(id, opts) {
  return apiDelete(`/api/v1/floors/${id}`, opts);
}
export function getAllBuildings(opts) {
  return apiGet("/api/v1/buildings", opts);
}
export function logout(opts) {
  return apiPost("/api/v1/auth/logout", undefined, opts);
}