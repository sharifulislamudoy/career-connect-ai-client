import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { request, jsonRequest, openProtectedPdf } from "../lib/api";
import { UsageTable } from "./Payment";
import { money } from "../lib/money";
const moduleNames = ["users", "jobs", "reports", "billing", "reviews"];
const tabs = ["overview", "users", "billing", "reviews"];
const dataTypes = [
  "documents",
  "interviews",
  "ats",
  "learning",
  "applications",
  "jobs",
  "reports",
  "workspace",
  "usage",
  "payments",
];
function Pager({ page, total, onChange }) {
  return (
    <div className="flex gap-4 items-center my-4 text-sm">
      <button
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className="border rounded-lg px-3 py-2 disabled:opacity-30"
      >
        Previous
      </button>
      <span>
        Page {page} · {total} records
      </span>
      <button
        disabled={page * 25 >= total}
        onClick={() => onChange(page + 1)}
        className="border rounded-lg px-3 py-2 disabled:opacity-30"
      >
        Next
      </button>
    </div>
  );
}
function Revenue({ data }) {
  return (
    <section className="bg-white border rounded-2xl p-5 space-y-4">
      <h2 className="text-xl font-bold">Subscription collections · BDT</h2>
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          ["Lifetime gross", data.totals.grossMinor],
          ["Lifetime net after refunds", data.totals.netMinor],
          ["This month collected", data.thisMonth.grossMinor],
        ].map(([label, value]) => (
          <div key={label} className="bg-slate-50 p-4 rounded-xl">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-2xl font-bold">{money(value)}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500">
        Cash collections by payment month in Bangladesh time. Net excludes
        recorded refunds, before Stripe fees and taxes. Legacy USD records are
        excluded from BDT totals.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th>Month</th>
              <th>Paid invoices</th>
              <th>Gross</th>
              <th>Refunds</th>
              <th>Net</th>
            </tr>
          </thead>
          <tbody>
            {data.revenue.map((r) => (
              <tr key={r._id} className="border-b">
                <td className="py-3">{r._id}</td>
                <td>{r.payments}</td>
                <td>{money(r.grossMinor)}</td>
                <td>{money(r.refundMinor)}</td>
                <td>{money(r.grossMinor - r.refundMinor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
function Record({ record, type, onError }) {
  const label =
    record.title ||
    record.skill ||
    record.fileName ||
    record.interviewConfig?.topic ||
    record.job?.title ||
    record.action ||
    record.plan ||
    record._id;
  return (
    <details className="bg-white border rounded-xl p-4">
      <summary className="cursor-pointer font-semibold break-words">
        {label}{" "}
        {record.status && (
          <span className="font-normal text-slate-500">· {record.status}</span>
        )}
      </summary>
      {type === "documents" && (
        <button
          className="text-blue-700 underline my-3"
          onClick={() =>
            openProtectedPdf(
              `/api/admin/reports/documents/${record._id}/pdf`,
            ).catch((e) => onError(e.message))
          }
        >
          Download user’s resume / CV PDF
        </button>
      )}
      {type === "applications" && (
        <p className="my-3">
          Applied to: {record.job?.title || record.jobId} ·{" "}
          {record.job?.company}
        </p>
      )}
      {type === "learning" && (
        <p className="my-3">
          Learning {record.skill} · {record.level} ·{" "}
          {(record.completedTaskIds || []).length} completed tasks
        </p>
      )}
      {type === "payments" && record.hostedInvoiceUrl && (
        <a
          className="block text-blue-700 underline my-3"
          target="_blank"
          rel="noreferrer"
          href={record.hostedInvoiceUrl}
        >
          Stripe invoice
        </a>
      )}
      <pre className="whitespace-pre-wrap break-words text-xs bg-slate-50 rounded-xl p-4 mt-3 max-h-[600px] overflow-y-auto">
        {JSON.stringify(record, null, 2)}
      </pre>
    </details>
  );
}
export default function AdminReports({ defaultTab = "overview" }) {
  const { userProfile } = useAuth();
  const allowed = (name) =>
    userProfile?.userType === "admin" ||
    (userProfile?.moderatorModules || []).includes(name);
  const [tab, setTab] = useState(
    allowed(defaultTab === "overview" ? "reports" : defaultTab)
      ? defaultTab
      : tabs.find((t) => allowed(t === "overview" ? "reports" : t)) || "none",
  );
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [plan, setPlan] = useState("");
  const [detail, setDetail] = useState(null);
  const [type, setType] = useState("documents");
  const [detailPage, setDetailPage] = useState(1);
  const [detailRecords, setDetailRecords] = useState([]);
  const [detailTotal, setDetailTotal] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [permissions, setPermissions] = useState([]);
  async function refresh() {
    setBusy(true);
    setError("");
    try {
      if (tab === "overview")
        setOverview(await request("/api/admin/reports/overview"));
      if (tab === "users") {
        const d = await request(
          `/api/admin/reports/users?page=${page}&search=${encodeURIComponent(search)}&role=${encodeURIComponent(role)}&plan=${plan}`,
        );
        setUsers(d.users);
        setTotal(d.total);
      }
      if (tab === "billing" || tab === "reviews") {
        const d = await request(
          `/api/admin/reports/${tab}?page=${page}${tab === "reviews" ? "&status=pending" : ""}`,
        );
        setRecords(d.records);
        setTotal(d.total);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    refresh();
  }, [tab, page, role, plan]);
  async function select(uid) {
    try {
      const d = await request(`/api/admin/reports/users/${uid}`);
      setDetail(d);
      setPermissions(d.user.moderatorModules || []);
      setType("documents");
      setDetailPage(1);
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    if (!detail) return;
    request(
      `/api/admin/reports/users/${detail.user.uid}/data/${type}?page=${detailPage}`,
    )
      .then((d) => {
        setDetailRecords(d.records);
        setDetailTotal(d.total);
      })
      .catch((e) => setError(e.message));
  }, [detail, type, detailPage]);
  async function decide(id, decision) {
    if (
      !window.confirm(
        `${decision === "approved" ? "Reopen" : "Reject review for"} this account?`,
      )
    )
      return;
    setBusy(true);
    try {
      await request(
        `/api/admin/reports/reviews/${id}/decision`,
        jsonRequest("POST", { decision, note }),
      );
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Platform reports</h1>
          <p className="mt-2 text-slate-600">
            Subscription usage, career activity, revenue and account reviews.
          </p>
        </div>
        <button
          disabled={busy}
          onClick={refresh}
          className="border bg-white rounded-xl px-4 py-2"
        >
          {busy ? "Loading…" : "Refresh"}
        </button>
      </header>
      <nav className="flex gap-2 flex-wrap">
        {tabs
          .filter((t) => allowed(t === "overview" ? "reports" : t))
          .map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setPage(1);
                setDetail(null);
              }}
              className={`px-4 py-2 rounded-xl capitalize ${tab === t ? "bg-blue-600 text-white" : "bg-white border"}`}
            >
              {t}
            </button>
          ))}
      </nav>
      {error && (
        <p role="alert" className="bg-red-50 p-4 rounded-xl text-red-700">
          {error}
        </p>
      )}
      {tab === "none" && (
        <p>
          No reporting modules are assigned to your moderator account. An admin
          can assign permissions.
        </p>
      )}
      {tab === "overview" && overview && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(overview.counts).map(([key, value]) => (
              <div className="bg-white border rounded-2xl p-5" key={key}>
                <p className="text-sm capitalize text-slate-500">
                  {key.replaceAll("_", " ")}
                </p>
                <p className="text-3xl font-bold mt-2">{value}</p>
              </div>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              ["User roles", overview.roles],
              ["Active plan access", overview.plans],
            ].map(([label, rows]) => (
              <section key={label} className="bg-white border rounded-2xl p-5">
                <h2 className="font-bold text-xl mb-3">{label}</h2>
                {rows.map((r) => (
                  <p key={r._id} className="flex justify-between border-b py-2">
                    <span>{r._id || "Unknown"}</span>
                    <strong>{r.count}</strong>
                  </p>
                ))}
              </section>
            ))}
          </div>
          {allowed("billing") && <Revenue data={overview} />}
          <section className="bg-white border rounded-2xl p-5">
            <h2 className="font-bold text-xl mb-3">
              Workspace & AI usage, email delivery
            </h2>
            {overview.usage.map((r) => (
              <p key={r._id} className="border-b py-3">
                {r._id}: {r.requests} requests · {r.credits} charged app credits
                · {r.inputTokens || 0} input / {r.outputTokens || 0} output
                tokens · {r.totalTokens || 0} total provider tokens
              </p>
            ))}
            <p className="mt-4">
              Pending account reviews: {overview.pendingReviews}
            </p>
            <p>
              Emails sent: {overview.emailQueue.sent} · Queued / retrying:{" "}
              {overview.emailQueue.pending}
            </p>
          </section>
        </>
      )}
      {tab === "users" && (
        <>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              refresh();
            }}
            className="flex flex-wrap gap-3"
          >
            <input
              aria-label="Search users"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, email or UID"
              className="border bg-white rounded-xl p-3"
            />
            <select
              aria-label="Role"
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setPage(1);
              }}
              className="border bg-white rounded-xl p-3"
            >
              <option value="">All roles</option>
              {["jobSeeker", "recruiter", "moderator", "admin"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
            <select
              aria-label="Plan"
              value={plan}
              onChange={(e) => {
                setPlan(e.target.value);
                setPage(1);
              }}
              className="border bg-white rounded-xl p-3"
            >
              <option value="">All plans</option>
              {["basic", "standard", "premium"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
            <button className="bg-blue-600 text-white rounded-xl px-4">
              Search
            </button>
          </form>
          <div className="overflow-x-auto bg-white border rounded-2xl p-4">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th>Name / email</th>
                  <th>Role</th>
                  <th>Plan</th>
                  <th>Account</th>
                  <th>Activity</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.uid} className="border-b">
                    <td className="py-3">
                      {u.displayName}
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </td>
                    <td>{u.userType}</td>
                    <td>{u.effectivePlan}</td>
                    <td>{u.isBanned ? "Banned" : u.status || "Active"}</td>
                    <td>
                      <button
                        className="text-blue-700 underline"
                        onClick={() => select(u.uid)}
                      >
                        View all data
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pager page={page} total={total} onChange={setPage} />
          </div>
          {detail && (
            <section className="space-y-4 bg-slate-100 border rounded-2xl p-5">
              <h2 className="text-xl font-bold">
                {detail.user.displayName} · {detail.user.email}
              </h2>
              <p>
                {detail.user.userType} · {detail.usage.plan} · Credits{" "}
                {detail.usage.credits.used} used /{" "}
                {detail.usage.credits.remaining === null
                  ? "Unlimited"
                  : detail.usage.credits.remaining + " remaining"}{" "}
                · Provider tokens {detail.usage.tokens.total}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(detail.stats).map(([key, n]) => (
                  <div className="bg-white rounded-xl p-3" key={key}>
                    {key}: <strong>{n}</strong>
                  </div>
                ))}
              </div>
              <details className="bg-white rounded-xl p-4">
                <summary className="cursor-pointer font-semibold">
                  Plan usage and remaining allowances
                </summary>
                <UsageTable usage={detail.usage} />
              </details>
              <details className="bg-white rounded-xl p-4">
                <summary className="cursor-pointer font-semibold">
                  Profile and registered devices
                </summary>
                <pre className="whitespace-pre-wrap break-words text-xs mt-3">
                  {JSON.stringify(detail.user, null, 2)}
                </pre>
              </details>
              {detail.user.userType === "moderator" &&
                userProfile.userType === "admin" && (
                  <div className="bg-white rounded-xl p-4 space-y-3">
                    <h3 className="font-semibold">Moderator permissions</h3>
                    <div className="flex gap-4 flex-wrap">
                      {moduleNames.map((m) => (
                        <label className="flex gap-2" key={m}>
                          <input
                            type="checkbox"
                            checked={permissions.includes(m)}
                            onChange={(e) =>
                              setPermissions(
                                e.target.checked
                                  ? [...permissions, m]
                                  : permissions.filter((p) => p !== m),
                              )
                            }
                          />
                          {m}
                        </label>
                      ))}
                    </div>
                    <button
                      className="text-blue-700 underline"
                      onClick={async () => {
                        try {
                          await request(
                            `/api/admin/reports/users/${detail.user.uid}/permissions`,
                            jsonRequest("PUT", { modules: permissions }),
                          );
                          await select(detail.user.uid);
                        } catch (e) {
                          setError(e.message);
                        }
                      }}
                    >
                      Save permissions
                    </button>
                  </div>
                )}
              <div className="flex gap-2 flex-wrap">
                {dataTypes
                  .filter((t) => t !== "payments" || allowed("billing"))
                  .map((t) => (
                    <button
                      key={t}
                      className={`px-3 py-2 rounded-lg capitalize ${type === t ? "bg-blue-600 text-white" : "bg-white border"}`}
                      onClick={() => {
                        setType(t);
                        setDetailPage(1);
                      }}
                    >
                      {t}
                    </button>
                  ))}
              </div>
              {detailRecords.map((r) => (
                <Record key={r._id} record={r} type={type} onError={setError} />
              ))}
              <Pager
                page={detailPage}
                total={detailTotal}
                onChange={setDetailPage}
              />
            </section>
          )}
        </>
      )}
      {tab === "billing" && (
        <>
          <p className="text-sm text-slate-600">
            All recorded payments. Open an entry for invoice and subscription
            details.
          </p>
          {records.map((r) => (
            <Record key={r._id} type="payments" record={r} onError={setError} />
          ))}
          <Pager page={page} total={total} onChange={setPage} />
        </>
      )}
      {tab === "reviews" && (
        <>
          <label className="block">
            Decision note
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={2000}
              rows={3}
              className="border bg-white rounded-xl p-3 w-full mt-2"
            />
          </label>
          {records.map((r) => (
            <article
              key={r._id}
              className="bg-white border rounded-2xl p-5 space-y-3"
            >
              <h2 className="font-semibold">
                {r.email} · {new Date(r.createdAt).toLocaleString()}
              </h2>
              <p className="whitespace-pre-wrap">{r.reason}</p>
              <div className="flex gap-3">
                <button
                  disabled={busy}
                  className="rounded-xl bg-green-700 text-white px-4 py-2"
                  onClick={() => decide(r._id, "approved")}
                >
                  Approve & reopen
                </button>
                <button
                  disabled={busy}
                  className="rounded-xl border px-4 py-2"
                  onClick={() => decide(r._id, "rejected")}
                >
                  Reject review
                </button>
              </div>
            </article>
          ))}
          <Pager page={page} total={total} onChange={setPage} />
        </>
      )}
    </div>
  );
}
