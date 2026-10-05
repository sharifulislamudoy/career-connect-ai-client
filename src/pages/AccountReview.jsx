import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { request, jsonRequest, clearDeviceSession } from "../lib/api";
export default function AccountReview() {
  const { logout } = useAuth();
  const [state, setState] = useState(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function refresh() {
    try {
      setState(await request("/api/account/status"));
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 30000);
    return () => clearInterval(timer);
  }, []);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await request("/api/account/review", jsonRequest("POST", { reason }));
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <section className="mx-auto max-w-xl rounded-2xl border bg-white p-6 space-y-5">
        <h1 className="text-2xl font-bold">Account review</h1>
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        {!state ? (
          <p>Checking account…</p>
        ) : !state.banned ? (
          <>
            <p>
              Your account is open. Sign out and sign in again to register your
              browser.
            </p>
            <button
              className="rounded-xl bg-blue-600 text-white px-4 py-3"
              onClick={() => {
                clearDeviceSession();
                logout();
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <p>
              Your account is restricted. A maximum of three registered browser
              profiles is allowed. An admin or authorized moderator can review
              your request.
            </p>
            <p className="text-sm text-slate-500">
              Reason: {state.reason || "Account restriction"}
            </p>
            {state.review ? (
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="font-semibold capitalize">
                  Review: {state.review.status}
                </p>
                <p>{state.review.note || "Your request has been saved."}</p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <label className="block">
                  Explain what happened
                  <textarea
                    required
                    minLength={20}
                    maxLength={3000}
                    rows={6}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-2 border rounded-xl p-3 w-full"
                  />
                </label>
                <button
                  disabled={busy}
                  className="rounded-xl bg-blue-600 text-white px-4 py-3 disabled:opacity-50"
                >
                  {busy ? "Submitting…" : "Request review"}
                </button>
              </form>
            )}
            <button onClick={logout} className="text-blue-700 underline">
              Sign out
            </button>
          </>
        )}
      </section>
    </main>
  );
}
