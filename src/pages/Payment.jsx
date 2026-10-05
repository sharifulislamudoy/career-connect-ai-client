import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { request, jsonRequest } from "../lib/api";
import { money } from "../lib/money";
const names = {
  documents: "Saved resumes + CVs",
  chat: "AI Coach messages",
  ats: "ATS checks",
  atsJob: "ATS job matching",
  interviews: "Mock interview sessions",
  learning: "Learning paths",
  coverLetter: "Cover letters",
  tailoring: "Job-specific resume tailoring",
  rewrite: "Resume rewrites",
  jobMatch: "Detailed job-match reports",
  skillGap: "Skill-gap reports",
  linkedin: "LinkedIn optimization",
  negotiation: "Salary negotiation",
  weeklyPlan: "Weekly AI action plans",
  workspace: "Active application entries",
  alerts: "Job alert rules",
};
export function UsageTable({ usage }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b">
            <th className="py-3">Feature</th>
            <th>Used</th>
            <th>Allowance</th>
            <th>Remaining</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(usage.features).map(([key, v]) => (
            <tr key={key} className="border-b">
              <td className="py-2">
                {names[key] || key}
                {v.lifetime ? " (lifetime trial)" : ""}
              </td>
              <td>{v.used}</td>
              <td>{v.limit === null ? "Unlimited" : v.limit}</td>
              <td>{v.remaining === null ? "Unlimited" : v.remaining}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default function Payment() {
  const [params] = useSearchParams();
  const [plans, setPlans] = useState([]);
  const [usage, setUsage] = useState(null);
  const [history, setHistory] = useState([]);
  const [cycle, setCycle] = useState("monthly");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function refresh() {
    try {
      const [p, u, h] = await Promise.all([
        request("/api/payments/plans"),
        request("/api/payments/status"),
        request("/api/payments/history"),
      ]);
      setPlans(p.plans);
      setUsage(u);
      setHistory(h.payments);
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    refresh();
    const timer =
      params.get("checkout") === "success" ? setInterval(refresh, 5000) : null;
    return () => clearInterval(timer);
  }, [params]);
  async function pay(plan) {
    setBusy(true);
    setError("");
    try {
      const data = await request(
        "/api/payments/checkout",
        jsonRequest("POST", { plan, billingCycle: cycle }),
      );
      window.location.assign(data.url);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }
  async function portal() {
    setBusy(true);
    try {
      const data = await request(
        "/api/payments/portal",
        jsonRequest("POST", {}),
      );
      window.location.assign(data.url);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }
  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-bold">
            Invest in your next opportunity
          </h1>
          <p className="text-slate-600 mt-2">
            Job search, applications, networking and your PDF downloads stay
            free.
          </p>
        </header>
        {error && (
          <p role="alert" className="bg-red-50 rounded-xl p-4 text-red-700">
            {error}
          </p>
        )}
        {params.get("checkout") === "success" && (
          <p className="bg-blue-50 p-4 rounded-xl">
            Checkout returned successfully. Your plan activates only after
            Stripe verifies payment. Refreshing your status…
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => setCycle("monthly")}
            className={`px-4 py-2 rounded-xl ${cycle === "monthly" ? "bg-blue-600 text-white" : "bg-white border"}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setCycle("yearly")}
            className={`px-4 py-2 rounded-xl ${cycle === "yearly" ? "bg-blue-600 text-white" : "bg-white border"}`}
          >
            Yearly · save 2 months
          </button>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <section
              key={plan.id}
              className={`rounded-2xl bg-white border p-6 ${plan.id === "standard" ? "border-blue-500 shadow-lg" : ""}`}
            >
              <h2 className="text-xl font-bold">{plan.name}</h2>
              <p className="text-3xl font-bold mt-3">
                {money(plan[cycle])}
                <span className="text-sm font-normal text-slate-500">
                  {" "}
                  / {cycle === "monthly" ? "month" : "year"}
                </span>
              </p>
              <p className="text-sm text-slate-500 mt-2">
                {plan.id === "basic"
                  ? "Start your career journey"
                  : plan.id === "standard"
                    ? "Tools for regular job seekers"
                    : "All career tools, unlimited personal usage"}
              </p>
              <ul className="space-y-2 mt-5 text-sm">
                {Object.entries(plan.limits).map(([key, value]) => (
                  <li
                    key={key}
                    className={
                      value === 0 ? "text-slate-400" : "text-slate-700"
                    }
                  >
                    {names[key]}:{" "}
                    {value === null
                      ? "Unlimited"
                      : value === 0
                        ? "Not included"
                        : `${value}${key === "tailoring" && plan.id === "basic" ? " lifetime trial" : ["documents", "workspace", "alerts"].includes(key) ? "" : " / month"}`}
                  </li>
                ))}
                <li>Templates: {plan.templates.join(", ")}</li>
                <li>Interview modes: {plan.modes.join(", ")}</li>
                {plan.customStyle && (
                  <li>Custom resume styling + full analytics</li>
                )}
              </ul>
              <button
                disabled={
                  busy || plan.id === "basic" || usage?.plan === plan.id
                }
                onClick={() => pay(plan.id)}
                className="w-full rounded-xl bg-blue-600 text-white mt-6 px-4 py-3 disabled:opacity-40"
              >
                {usage?.plan === plan.id
                  ? "Current plan"
                  : plan.id === "basic"
                    ? "Always free"
                    : `Choose ${plan.name}`}
              </button>
            </section>
          ))}
        </div>
        <p className="text-sm text-slate-500">
          Premium has no monthly usage quota for personal use. All plans have
          rate, concurrency, input-size and provider-capacity limits. AI credits
          are weighted app units; each tool has its own allowance. Monthly
          quotas reset on the first day of each month in Bangladesh time,
          including annual subscribers.
        </p>
        {usage && (
          <section className="bg-white border rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap justify-between gap-3">
              <h2 className="text-xl font-bold capitalize">
                {usage.plan} · usage {usage.period}
              </h2>
              <button
                onClick={portal}
                disabled={busy}
                className="text-blue-700 underline"
              >
                Manage billing / cancel / change plan
              </button>
            </div>
            <p>
              Status: {usage.subscriptionStatus} ·{" "}
              {usage.expiresAt
                ? `Access expiry: ${new Date(usage.expiresAt).toLocaleDateString()}`
                : "Free account"}
            </p>
            <p>
              App credits: {usage.credits.used} used ·{" "}
              {usage.credits.remaining === null
                ? "Unlimited"
                : `${usage.credits.remaining} remaining`}{" "}
              · Provider tokens: {usage.tokens.total}
            </p>
            <UsageTable usage={usage} />
            <Link to="/career" className="inline-block text-blue-700 underline">
              Open career tools
            </Link>
          </section>
        )}
        <section className="bg-white border rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">Payment history</h2>
          {!history.length ? (
            <p>No subscription payments yet.</p>
          ) : (
            history.map((p) => (
              <div
                key={p._id}
                className="border-b py-3 flex flex-wrap justify-between gap-2"
              >
                <span>
                  {p.plan} ·{" "}
                  {new Date(p.completedAt || p.createdAt).toLocaleDateString()}
                </span>
                <span>
                  {p.amountMinor != null
                    ? money(p.amountMinor)
                    : `${p.currency || "usd"} ${p.amount} (legacy)`}
                </span>
                {p.hostedInvoiceUrl && (
                  <a
                    className="text-blue-700 underline"
                    href={p.hostedInvoiceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Stripe invoice
                  </a>
                )}
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
