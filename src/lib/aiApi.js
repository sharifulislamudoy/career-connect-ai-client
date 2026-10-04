import { getAuth } from "firebase/auth";
import app from "../Firebae/Firebase__config__";

import { API_BASE_URL } from "./api";
export { API_BASE_URL } from "./api";

export async function authenticatedFetch(path, options = {}) {
  const user = getAuth(app).currentUser;
  if (!user) throw new Error("Please sign in to use AI.");
  const token = await user.getIdToken();
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
}

export async function aiRequest(path, body, signal) {
  const response = await authenticatedFetch(`/api/ai${path}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body), signal,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success) throw new Error(data?.error || "AI request failed. Please try again.");
  return data;
}
