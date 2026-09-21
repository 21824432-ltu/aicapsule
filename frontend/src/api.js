// api.js
// All requests use credentials: "include" so the HttpOnly "token" cookie
// is sent automatically. The frontend never reads or stores the JWT
// itself — it's HttpOnly by design (Section 9 of the spec).

// In dev, Vite proxies /api to the backend (see vite.config.js), so a
// relative path works in both dev and production (same-origin deploy).
const BASE_URL = "/api/capsules";

async function handleResponse(res) {
  if (res.status === 401) {
    const err = new Error("UNAUTHORIZED");
    err.status = 401;
    throw err;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Something went wrong.");
  }
  return data;
}

export async function getMe() {
  const res = await fetch("/api/me", { credentials: "include" });
  return handleResponse(res);
}

export async function getCapsules() {
  const res = await fetch(BASE_URL, { credentials: "include" });
  return handleResponse(res);
}

export async function createCapsule(payload) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateCapsule(id, payload) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteCapsule(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  return handleResponse(res);
}

export async function logout() {
  const res = await fetch("/logout", { method: "POST", credentials: "include" });
  return res.json();
}
