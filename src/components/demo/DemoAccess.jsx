import { createElement, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import { FaBriefcase, FaUserTie, FaUserShield, FaShieldAlt } from "react-icons/fa";
import app from "../../Firebae/Firebase__config__";
import { API_BASE_URL, clearDeviceSession } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";

const choices = [
  { id: "jobSeeker", title: "Job seeker", detail: "Jobs, resume & AI tools", Icon: FaBriefcase },
  { id: "recruiter", title: "Recruiter", detail: "Post jobs & review applicants", Icon: FaUserTie },
  { id: "moderator", title: "Moderator", detail: "Users, jobs & reports", Icon: FaUserShield },
  { id: "admin", title: "Admin", detail: "Full demo administration", Icon: FaShieldAlt },
];

const pendingKey = "career-demo-pending";
function readPending() {
  try {
    const item = JSON.parse(sessionStorage.getItem(pendingKey));
    return item && Date.now() - item.createdAt < 30000 &&
      ["/jobs", "/my-jobs", "/admin/reports", "/admin/dashboard"].includes(item.redirectTo) ? item : null;
  } catch { return null; }
}

export default function DemoAccess() {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(readPending);
  const inFlight = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (import.meta.env.VITE_DEMO_MODE !== "true") return;
    const controller = new AbortController();
    fetch(`${API_BASE_URL}/api/auth/demo`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (response.ok && !controller.signal.aborted) setEnabled(data.enabled === true);
      }).catch(() => {});
    return () => { mounted.current = false; controller.abort(); };
  }, []);

  useEffect(() => {
    if (pending && userProfile?.uid === pending.uid) {
      navigate(pending.redirectTo, { replace: true });
      sessionStorage.removeItem(pendingKey);
      setPending(null);
      setBusy("");
      inFlight.current = false;
    }
  }, [pending, userProfile?.uid, navigate]);

  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => {
      setError("Your demo profile could not load. Retry or sign out and try again.");
      setBusy("");
      sessionStorage.removeItem(pendingKey);
      setPending(null);
      inFlight.current = false;
    }, 20000);
    return () => clearTimeout(timer);
  }, [pending]);

  async function enter(role) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(role);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/demo/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      });
      const data = await response.json();
      if (!response.ok || !data.customToken) throw new Error(data.error || "Demo login failed.");
      if (!mounted.current) return;
      const auth = getAuth(app);
      const destination = { uid: data.uid, redirectTo: data.redirectTo, createdAt: Date.now() };
      sessionStorage.setItem(pendingKey, JSON.stringify(destination));
      setPending(destination);
      clearDeviceSession();
      await signInWithCustomToken(auth, data.customToken);
    } catch (failure) {
      sessionStorage.removeItem(pendingKey);
      if (mounted.current) {
        setError(failure.message || "Could not open this demo role.");
        setBusy("");
        setPending(null);
        inFlight.current = false;
      }
    }
  }

  if (!enabled) return null;
  return (
    <section aria-label="Explore demo roles" className="my-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-blue-950">Explore Career Connect AI</h2>
          <p className="mt-1 text-xs leading-relaxed text-blue-800">Choose a role. Each switch opens a fresh sample account in this demo.</p>
        </div>
        {userProfile?.isDemo && <button type="button" disabled={!!busy || !!pending} onClick={async () => {
          try { await logout(); navigate("/", { replace: true }); } catch (failure) { setError(failure.message); }
        }} className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 disabled:opacity-50">Exit demo</button>}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {choices.map(({ id, title, detail, Icon }) => (
          <button key={id} type="button" onClick={() => enter(id)} disabled={!!busy || !!pending}
            aria-pressed={userProfile?.isDemo === true && userProfile?.userType === id}
            className="rounded-xl border border-blue-100 bg-white p-3 text-left hover:border-blue-500 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-60">
            {createElement(Icon, { "aria-hidden": true, className: "mb-2 text-blue-600" })}
            <span className="block text-xs font-bold text-slate-900">{busy === id ? "Opening…" : title}</span>
            <span className="mt-1 block text-[11px] leading-relaxed text-slate-500">{detail}</span>
          </button>
        ))}
      </div>
      {busy && <p role="status" className="mt-3 text-xs text-blue-800">Signing in and loading your demo workspace…</p>}
      {error && <p role="alert" className="mt-3 text-xs text-red-700">{error}</p>}
    </section>
  );
}
