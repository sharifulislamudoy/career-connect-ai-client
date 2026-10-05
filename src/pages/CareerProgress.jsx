import { useEffect, useState } from "react";
import { Link } from "react-router";
import { request, clearDeviceSession } from "../lib/api";
export default function CareerProgress() {
  const [data, setData] = useState(null);
  const [account, setAccount] = useState(null);
  const [error, setError] = useState("");
  async function refresh() {
    const [d, a] = await Promise.all([
      request("/api/tools/progress"),
      request("/api/account/status"),
    ]);
    setData(d);
    setAccount(a);
  }
  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, []);
  return (
    <main className="bg-slate-50 min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-5">
        <h1 className="text-3xl font-bold">Career progress</h1>
        <div className="flex gap-4">
          <Link to="/career" className="text-blue-700 underline">
            Career tools
          </Link>
          <Link to="/pricing" className="text-blue-700 underline">
            Usage & plans
          </Link>
        </div>
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        {data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                "documents",
                "atsChecks",
                "applications",
                "completedInterviews",
              ].map((k) => (
                <div key={k} className="bg-white border rounded-2xl p-5">
                  <p className="text-sm text-slate-500">
                    {k.replace(/([A-Z])/g, " $1")}
                  </p>
                  <p className="text-3xl font-bold">{data[k]}</p>
                </div>
              ))}
            </div>
            <section className="bg-white border rounded-2xl p-5">
              <h2 className="font-bold text-xl mb-3">Interview score trends</h2>
              {data.plan === "basic" ? (
                <Link className="text-blue-700 underline" to="/pricing">
                  Standard unlocks interview trends
                </Link>
              ) : (
                data.trends.map((t, i) => (
                  <div
                    key={i}
                    className="border-b py-3 flex justify-between gap-4"
                  >
                    <span>
                      {t.topic} · {new Date(t.date).toLocaleDateString()}
                    </span>
                    <strong>{t.score}/10</strong>
                  </div>
                ))
              )}
              {data.plan === "premium" && (
                <>
                  <h3 className="font-semibold mt-4">
                    Recurring improvement points
                  </h3>
                  {data.recurringImprovements.map(([text, count]) => (
                    <p key={text} className="mt-2">
                      {text}{" "}
                      <span className="text-slate-500">({count} mentions)</span>
                    </p>
                  ))}
                  <Link
                    to="/career/tools/weekly-plan"
                    className="inline-block mt-4 text-blue-700 underline"
                  >
                    Generate this week’s AI action plan
                  </Link>
                </>
              )}
            </section>
            <section className="bg-white border rounded-2xl p-5">
              <h2 className="font-bold text-xl mb-3">What you’re learning</h2>
              {data.learning.map((p) => (
                <div key={p._id} className="py-3">
                  <p>
                    {p.skill} · {p.level} · {p.completed}/{p.total} tasks
                  </p>
                  <progress
                    value={p.completed}
                    max={p.total || 1}
                    className="w-full"
                  />
                </div>
              ))}
              <Link to="/learning-path" className="text-blue-700 underline">
                Manage learning paths
              </Link>
            </section>
          </>
        )}
        <section className="bg-white border rounded-2xl p-5 space-y-3">
          <h2 className="font-bold text-xl">Registered devices</h2>
          <p className="text-sm text-slate-600">
            Maximum three browser profiles. Remove an old browser before adding
            a fourth. Signing out alone does not remove a registered device.
          </p>
          {account?.devices.map((d) => (
            <div key={d.id} className="border-b py-3">
              <p className="text-sm break-all">{d.label}</p>
              <p className="text-xs text-slate-500">
                Last seen: {new Date(d.lastSeenAt).toLocaleString()}
              </p>
              <button
                className="text-red-700 text-sm"
                onClick={async () => {
                  if (
                    !window.confirm(
                      "Remove this device? It will need to register again.",
                    )
                  )
                    return;
                  try {
                    await request(`/api/account/devices/${d.id}`, {
                      method: "DELETE",
                    });
                    clearDeviceSession();
                    await refresh();
                  } catch (e) {
                    setError(e.message);
                  }
                }}
              >
                Remove device
              </button>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
