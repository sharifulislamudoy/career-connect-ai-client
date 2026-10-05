import { getAuth } from "firebase/auth";
import app from "../Firebae/Firebase__config__";
import { apiFetch, API_BASE_URL } from "./api";
export { API_BASE_URL } from "./api";
export async function authenticatedFetch(path, options = {}) {
  if (!getAuth(app).currentUser) throw new Error("Please sign in.");
  return apiFetch(`${API_BASE_URL}${path}`, options);
}
export async function aiRequest(path, body, signal) {
  const response = await authenticatedFetch(`/api/ai${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success)
    throw new Error(data?.error || data?.message || "AI request failed.");
  return data;
}
