import { useEffect, useState } from "react";
import { Link } from "react-router";
import { request, jsonRequest } from "../lib/api";
const empty = {
  title: "",
  company: "",
  url: "",
  status: "saved",
  notes: "",
  followUpAt: "",
  archived: false,
};
export default function CareerWorkspace() {
  const [items, setItems] = useState([]);
  const [listPage, setListPage] = useState(1);
  const [listTotal, setListTotal] = useState(0);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [usage, setUsage] = useState(null);
  async function refresh() {
    const [d, u] = await Promise.all([
      request("/api/workspace"),
      request("/api/account/usage"),
    ]);
    setItems(d.items);
    setListPage(1);
    setListTotal(d.total || 0);
    setUsage(u);
  }
  async function loadMore() {
    try {
      const data = await request("/api/workspace?page=" + (listPage + 1));
      setItems((old) => [...old, ...data.items]);
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
        "/api/workspace" + (editing ? `/${editing}` : ""),
        jsonRequest(editing ? "PUT" : "POST", {
          ...form,
          followUpAt: form.followUpAt
            ? new Date(form.followUpAt).toISOString()
            : null,
        }),
      );
      setEditing(null);
      setForm(empty);
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function edit(item) {
    setEditing(item._id);
    setForm({
      ...item,
      followUpAt: item.followUpAt
        ? new Date(
            new Date(item.followUpAt).getTime() -
              new Date(item.followUpAt).getTimezoneOffset() * 60000,
          )
            .toISOString()
            .slice(0, 16)
        : "",
    });
  }
  return (
    <main className="bg-slate-50 min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-bold">Application workspace</h1>
          <p className="mt-2 text-slate-600">
            Track external jobs, notes and follow-up reminders. Your platform
            applications remain in My Applications.
          </p>
          <Link className="text-blue-700 underline" to="/my-applications">
            My Applications
          </Link>
          <span className="mx-3">·</span>
          <Link className="text-blue-700 underline" to="/career">
            Career tools
          </Link>
        </header>
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        <p>
          {usage?.features.workspace.used || 0} active · allowance{" "}
          {usage?.features.workspace.limit === null
            ? "Unlimited"
            : usage?.features.workspace.limit}
        </p>
        <div className="grid lg:grid-cols-[350px_1fr] gap-5">
          <form
            onSubmit={save}
            className="bg-white border rounded-2xl p-5 space-y-4 self-start"
          >
            <h2 className="font-bold">
              {editing ? "Edit entry" : "Add a job"}
            </h2>
            {[
              ["title", "Job title"],
              ["company", "Company"],
              ["url", "Job URL"],
            ].map(([key, label]) => (
              <label key={key} className="block">
                {label}
                <input
                  required={key !== "url"}
                  type={key === "url" ? "url" : "text"}
                  maxLength={2000}
                  className="mt-1 w-full border rounded-xl p-3"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </label>
            ))}
            <label className="block">
              Status
              <select
                className="mt-1 w-full border rounded-xl p-3"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {["saved", "applied", "interview", "offer", "rejected"].map(
                  (s) => (
                    <option key={s}>{s}</option>
                  ),
                )}
              </select>
            </label>
            <label className="block">
              Follow-up date & time
              <input
                type="datetime-local"
                className="mt-1 w-full border rounded-xl p-3"
                value={form.followUpAt}
                onChange={(e) =>
                  setForm({ ...form, followUpAt: e.target.value })
                }
              />
            </label>
            <label className="block">
              Notes
              <textarea
                rows={4}
                maxLength={5000}
                className="mt-1 w-full border rounded-xl p-3"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </label>
            <label className="flex gap-2">
              <input
                type="checkbox"
                checked={form.archived}
                onChange={(e) =>
                  setForm({ ...form, archived: e.target.checked })
                }
              />
              Archived
            </label>
            <button
              disabled={busy}
              className="rounded-xl bg-blue-600 text-white px-4 py-3"
            >
              {busy ? "Saving…" : "Save entry"}
            </button>
            {editing && (
              <button
                type="button"
                className="ml-4"
                onClick={() => {
                  setEditing(null);
                  setForm(empty);
                }}
              >
                Cancel
              </button>
            )}
          </form>
          <section className="space-y-3">
            {items.map((item) => (
              <article
                key={item._id}
                className="bg-white border rounded-2xl p-5"
              >
                <div className="flex justify-between gap-3">
                  <h2 className="text-lg font-bold">{item.title}</h2>
                  <span className="text-sm capitalize">
                    {item.status}
                    {item.archived ? " · archived" : ""}
                  </span>
                </div>
                <p>{item.company}</p>
                <p className="whitespace-pre-wrap text-slate-600 my-3">
                  {item.notes}
                </p>
                {item.followUpAt && (
                  <p className="text-sm">
                    Follow up: {new Date(item.followUpAt).toLocaleString()}
                  </p>
                )}
                <div className="flex gap-4 mt-3 text-sm">
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-700 underline"
                    >
                      Job link
                    </a>
                  )}
                  <button onClick={() => edit(item)} className="text-blue-700">
                    Edit
                  </button>
                  <button
                    className="text-red-700"
                    onClick={async () => {
                      if (!window.confirm("Delete entry?")) return;
                      try {
                        await request(`/api/workspace/${item._id}`, {
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
          </section>
        </div>
      </div>
      {items.length < listTotal && (
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
