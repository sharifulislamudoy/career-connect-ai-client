import { getAuth } from "firebase/auth";
import app from "../Firebae/Firebase__config__";
export const API_BASE_URL = (
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"
).replace(/\/+$/, "");
let registration;
let registeredUid;
const deviceKey = "career-device-id-v1";
function deviceId() {
  let id = localStorage.getItem(deviceKey);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(deviceKey, id);
  }
  return id;
}
export function deviceCredentials(uid) {
  return {
    deviceId: deviceId(),
    deviceToken: localStorage.getItem(`career-device-token:${uid}`) || "",
  };
}
export function clearDeviceSession() {
  registration = null;
  registeredUid = null;
}
export async function ensureDevice(user) {
  if (!user) return null;
  if (registeredUid === user.uid && registration) return registration;
  registeredUid = user.uid;
  registration = (async () => {
    const response = await fetch(`${API_BASE_URL}/api/account/device`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await user.getIdToken()}`,
      },
      body: JSON.stringify({
        ...deviceCredentials(user.uid),
        label: navigator.userAgent.slice(0, 120),
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      if (data.code === "ACCOUNT_BANNED")
        window.dispatchEvent(new CustomEvent("career-account-banned"));
      throw new Error(data.error || "Device registration failed.");
    }
    if (data.deviceToken)
      localStorage.setItem(`career-device-token:${user.uid}`, data.deviceToken);
    if (data.needsProfile) clearDeviceSession();
    return data;
  })().catch((error) => {
    clearDeviceSession();
    throw error;
  });
  return registration;
}
export async function apiFetch(input, options = {}) {
  const url = new URL(input, window.location.origin);
  const base = new URL(API_BASE_URL, window.location.origin);
  if (
    url.origin !== base.origin ||
    !url.pathname.startsWith(`${base.pathname.replace(/\/$/, "")}/api/`)
  )
    return fetch(input, options);
  const headers = new Headers(options.headers);
  const user = getAuth(app).currentUser;
  if (user) {
    headers.set("Authorization", `Bearer ${await user.getIdToken()}`);
    headers.set("x-user-id", user.uid);
    if (
      !url.pathname.includes("/api/auth/") &&
      !url.pathname.includes("/api/account/")
    )
      await ensureDevice(user);
    const d = deviceCredentials(user.uid);
    headers.set("x-device-id", d.deviceId);
    headers.set("x-device-token", d.deviceToken);
  }
  const response = await fetch(input, {
    ...options,
    headers,
    cache: "no-store",
  });
  if (response.status === 403 || response.status === 401) {
    const data = await response
      .clone()
      .json()
      .catch(() => null);
    if (data?.code === "ACCOUNT_BANNED")
      window.dispatchEvent(new CustomEvent("career-account-banned"));
    if (data?.code === "DEVICE_REQUIRED") clearDeviceSession();
  }
  if (options.method === "POST" && url.pathname.endsWith("/api/users"))
    clearDeviceSession();
  return response;
}
export async function request(path, options = {}) {
  const response = await apiFetch(`${API_BASE_URL}${path}`, options);
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(data?.error || data?.message || "Request failed.");
  return data;
}
export const jsonRequest = (method, body) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
export async function openProtectedPdf(path) {
  const response = await apiFetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "PDF unavailable.");
  }
  const url = URL.createObjectURL(await response.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = "Resume.pdf";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
