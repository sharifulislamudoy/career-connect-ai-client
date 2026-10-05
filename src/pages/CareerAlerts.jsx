import { useEffect, useState } from "react";
import { Link } from "react-router";
import { request, jsonRequest } from "../lib/api";
const empty = {
  name: "",
  search: "",
  location: "",
  type: "",
  experience: "",
  enabled: true,
};
export default function CareerAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [listPage, setListPage] = useState(1);
  const [listTotal, setListTotal] = useState(0);
  const [usage, setUsage] = useState(null);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function refresh() {
    const [d, u] = await Promise.all([
      request("/api/job-alerts"),
      request("/api/account/usage"),
    ]);
    setAlerts(d.alerts);
    setListPage(1);
    setListTotal(d.total || 0);
    setUsage(u);
  }
  async function loadMore() {
    try {
      const data = await request("/api/job-alerts?page=" + (listPage + 1));
      setAlerts((old) => [...old, ...data.alerts]);
      setListPage(data.page);
    } catch (error) {
      setError(error.message);
    }
  }
  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, []);
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await request(
        "/api/job-alerts" + (editing ? `/${editing}` : ""),
        jsonRequest(editing ? "PUT" : "POST", form),
      );
      setForm(empty);
      setEditing(null);
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="bg-slate-50 min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-5">
        <h1 className="font-bold text-3xl">Saved job alerts</h1>
        <p>
          Receive email and in-app notifications for new matching jobs posted on
          this platform.
        </p>
        <Link to="/career" className="text-blue-700 underline">
          Career tools
        </Link>
        <p>
          Saved rules: {usage?.features.alerts.used || 0} /{" "}
          {usage?.features.alerts.limit === null
            ? "Unlimited"
            : usage?.features.alerts.limit}
        </p>
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        <div className="grid md:grid-cols-2 gap-5">
          <form
            onSubmit={save}
            className="bg-white border rounded-2xl p-5 space-y-3"
          >
            {[
              ["name", "Alert name"],
              ["search", "Search keyword"],
              ["location", "Location"],
              ["type", "Job type (exact platform value)"],
              ["experience", "Experience (exact platform value)"],
            ].map(([key, label]) => (
              <label className="block" key={key}>
                {label}
                <input
                  required={key === "name"}
                  maxLength={150}
                  className="mt-1 w-full border rounded-xl p-3"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </label>
            ))}
            <label className="flex gap-2">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) =>
                  setForm({ ...form, enabled: e.target.checked })
                }
              />
              Enabled
            </label>
            <button
              disabled={busy}
              className="px-4 py-3 rounded-xl bg-blue-600 text-white"
            >
              {busy ? "Saving…" : editing ? "Update alert" : "Create alert"}
            </button>
            {editing && (
              <button
                type="button"
                className="ml-3"
                onClick={() => {
                  setEditing(null);
                  setForm(empty);
                }}
              >
                Cancel
              </button>
            )}
          </form>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <article
                key={alert._id}
                className="bg-white border rounded-2xl p-5"
              >
                <h2 className="font-bold">{alert.name}</h2>
                <p className="text-sm text-slate-600">
                  {[alert.search, alert.location, alert.type, alert.experience]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p>{alert.enabled ? "Enabled" : "Paused"}</p>
                <div className="flex gap-4 mt-3">
                  <button
                    className="text-blue-700"
                    onClick={() => {
                      setEditing(alert._id);
                      setForm(alert);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-700"
                    onClick={async () => {
                      if (!window.confirm("Delete alert?")) return;
                      try {
                        await request(`/api/job-alerts/${alert._id}`, {
                          method: "DELETE",
                        });
                        await refresh();
                      } catch (e) {
                        setError(e.message);
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
      {alerts.length < listTotal && (
        <button
          onClick={loadMore}
          className="block mx-auto my-5 rounded-xl border bg-white px-5 py-3"
        >
          Load more saved records
        </button>
      )}
    </main>
  );
}
