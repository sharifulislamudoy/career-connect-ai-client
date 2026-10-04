import { getAuth } from "firebase/auth";
import app from "../Firebae/Firebase__config__";

export const API_BASE_URL = (
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"
).replace(/\/+$/, "");

// Only attach credentials to this application's API, never external uploads.
export async function apiFetch(input, options = {}) {
  const url = new URL(input, window.location.origin);
  const base = new URL(API_BASE_URL, window.location.origin);
  if (
    url.origin !== base.origin ||
    !url.pathname.startsWith(`${base.pathname.replace(/\/$/, "")}/api/`)
  ) {
    return fetch(input, options);
  }
  const headers = new Headers(options.headers);
  const user = getAuth(app).currentUser;
  if (user) {
    headers.set("Authorization", `Bearer ${await user.getIdToken()}`);
    headers.set("x-user-id", user.uid);
  }
  return fetch(input, { ...options, headers, cache: "no-store" });
}
