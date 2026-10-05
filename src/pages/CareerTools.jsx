import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useParams } from "react-router";
import { request, jsonRequest } from "../lib/api";
import { resumeRequest, jsonOptions } from "../lib/resumeApi";
const toolLabels = {
  "cover-letter": "Cover letter",
  "resume-tailoring": "Job-specific resume tailoring",
  "resume-rewrite": "Resume rewrite",
  "job-match": "Advanced job-match report",
  "skill-gap": "Skill-gap analysis",
  linkedin: "LinkedIn profile optimizer",
  "salary-negotiation": "Salary negotiation coach",
  "weekly-plan": "Weekly career action plan",
};
const hints = {
  "cover-letter": "Select your resume and paste the target job description.",
  "resume-tailoring":
    "Choose a saved resume. AI rewrites relevant descriptions; review all facts before saving a new version.",
  "resume-rewrite":
    "Paste the summary or experience bullet you want to improve.",
  "job-match":
    "Paste the job description to compare real matches, gaps and unknowns.",
  "skill-gap": "Describe your target role and the skills you want to develop.",
  linkedin:
    "Tell us your target role and tone. Get a headline, About and experience draft.",
  "salary-negotiation":
    "Enter the offer, currency, expectations and constraints. No live salary-market data is fetched.",
  "weekly-plan": "Describe this week’s available time, target roles and goals.",
};
export default function CareerTools() {
  const { tool } = useParams();
  const { user } = useAuth();
  const [usage, setUsage] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [history, setHistory] = useState([]);
  const [listPage, setListPage] = useState(1);
  const [listTotal, setListTotal] = useState(0);
  const [resumeId, setResumeId] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function refresh() {
    const [u, r, h] = await Promise.all([
      request("/api/account/usage"),
      resumeRequest("/api/resumes/user/" + user.uid),
      request("/api/tools/reports"),
    ]);
    setUsage(u);
    setResumes(r);
    setHistory(h.reports);
    setListPage(1);
    setListTotal(h.total || 0);
  }
  async function loadMore() {
    try {
      const data = await request("/api/tools/reports?page=" + (listPage + 1));
      setHistory((old) => [...old, ...data.reports]);
      setListPage(data.page);
    } catch (error) {
      setError(error.message);
    }
  }
  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    setReport(null);
    setPrompt("");
    setDescription("");
    setError("");
    setMessage("");
  }, [tool]);
  const features = {
    "cover-letter": "coverLetter",
    "resume-tailoring": "tailoring",
    "resume-rewrite": "rewrite",
    "job-match": "jobMatch",
    "skill-gap": "skillGap",
    linkedin: "linkedin",
    "salary-negotiation": "negotiation",
    "weekly-plan": "weeklyPlan",
  };
  const allowance = usage?.features[features[tool]];
  async function generate(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const data = await request(
        `/api/tools/generate/${tool}`,
        jsonRequest("POST", {
          resumeId: resumeId || undefined,
          prompt,
          jobDescription: description,
        }),
      );
      setReport(data.report);
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function saveDocument() {
    setBusy(true);
    try {
      await resumeRequest("/api/resumes", jsonOptions("POST", report.document));
      setMessage(
        "Tailored version saved. Open Resume Builder to edit and download the PDF.",
      );
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(
        [
          report.title,
          report.summary,
          report.draft,
          ...report.sections.map((s) => `${s.heading}\n${s.items.join("\n")}`),
        ].join("\n\n"),
      );
      setMessage("Copied.");
    } catch {
      setError("Clipboard is unavailable. Select and copy the text.");
    }
  }
  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-bold">
            {toolLabels[tool] || "Career toolkit"}
          </h1>
          <p className="mt-2 text-slate-600">
            Use your real experience to prepare stronger applications.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link className="text-blue-700 underline" to="/career/progress">
              Career progress
            </Link>
            <Link className="text-blue-700 underline" to="/career/workspace">
              Application workspace
            </Link>
            <Link className="text-blue-700 underline" to="/career/alerts">
              Job alerts
            </Link>
            <Link className="text-blue-700 underline" to="/pricing">
              Usage & plans
            </Link>
          </div>
        </header>
        {error && (
          <p role="alert" className="bg-red-50 p-4 rounded-xl text-red-700">
            {error}
          </p>
        )}
        {message && (
          <p
            role="status"
            className="bg-green-50 p-4 rounded-xl text-green-800"
          >
            {message}
          </p>
        )}
        {!tool ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(toolLabels).map(([id, label]) => {
              const f = usage?.features[features[id]];
              return (
                <Link
                  key={id}
                  to={`/career/tools/${id}`}
                  className="bg-white rounded-2xl border p-5 hover:border-blue-500 transition-colors"
                >
                  <h2 className="font-semibold text-lg">{label}</h2>
                  <p className="text-sm text-slate-600 mt-2">{hints[id]}</p>
                  <p className="text-blue-700 text-sm mt-4">
                    {f?.remaining === null
                      ? "Unlimited"
                      : `${f?.remaining ?? "…"} remaining`}
                    {f?.lifetime ? " · lifetime trial" : ""}
                  </p>
                </Link>
              );
            })}
          </div>
        ) : !toolLabels[tool] ? (
          <p>Unknown tool.</p>
        ) : (
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-5">
            <form
              onSubmit={generate}
              className="rounded-2xl border bg-white p-6 space-y-4 self-start"
            >
              <p className="text-sm text-slate-600">{hints[tool]}</p>
              <p className="text-sm font-medium">
                Allowance:{" "}
                {allowance?.remaining === null
                  ? "Unlimited"
                  : `${allowance?.remaining ?? "…"} remaining`}
              </p>
              <label className="block">
                Source resume / CV
                <select
                  value={resumeId}
                  required={tool === "resume-tailoring"}
                  onChange={(e) => setResumeId(e.target.value)}
                  className="block border rounded-xl p-3 w-full mt-2"
                >
                  <option value="">
                    Use current profile and coach context
                  </option>
                  {resumes.map((r) => (
                    <option value={r._id} key={r._id}>
                      {r.title}
                    </option>
                  ))}
                </select>
              </label>
              {["cover-letter", "resume-tailoring", "job-match"].includes(
                tool,
              ) && (
                <label className="block">
                  Job description
                  <textarea
                    required
                    minLength={40}
                    maxLength={10000}
                    rows={9}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="block border rounded-xl p-3 w-full mt-2"
                  />
                </label>
              )}
              <label className="block">
                Your instructions / relevant details
                <textarea
                  required={
                    ![
                      "cover-letter",
                      "resume-tailoring",
                      "job-match",
                      "weekly-plan",
                    ].includes(tool)
                  }
                  maxLength={10000}
                  rows={5}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="block border rounded-xl p-3 w-full mt-2"
                />
              </label>
              <button
                disabled={busy || allowance?.remaining === 0}
                className="bg-blue-600 text-white rounded-xl px-5 py-3 disabled:opacity-40"
              >
                {busy ? "Preparing…" : "Generate & save report"}
              </button>
              {allowance?.remaining === 0 && (
                <Link to="/pricing" className="block text-blue-700 underline">
                  See plans to unlock more usage
                </Link>
              )}
            </form>
            <section className="border bg-white rounded-2xl p-6 space-y-4">
              {!report ? (
                <p>Your generated report appears here.</p>
              ) : (
                <>
                  <h2 className="text-xl font-bold">{report.title}</h2>
                  <p className="whitespace-pre-wrap">{report.summary}</p>
                  {Number.isFinite(report.score) && (
                    <p className="font-bold">
                      Estimated fit: {report.score}/100
                    </p>
                  )}
                  <p className="whitespace-pre-wrap bg-slate-50 rounded-xl p-4">
                    {report.draft}
                  </p>
                  {report.sections.map((section, i) => (
                    <div key={i}>
                      <h3 className="font-semibold">{section.heading}</h3>
                      <ul className="list-disc pl-5 space-y-2">
                        {section.items.map((item, j) => (
                          <li key={j} className="whitespace-pre-wrap">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  <div className="flex gap-4 flex-wrap">
                    <button className="text-blue-700 underline" onClick={copy}>
                      Copy report
                    </button>
                    {report.document && (
                      <button
                        disabled={busy}
                        className="rounded-xl bg-blue-600 text-white px-4 py-2"
                        onClick={saveDocument}
                      >
                        Save reviewed tailored resume
                      </button>
                    )}
                    <Link
                      to="/create-resume"
                      className="text-blue-700 underline"
                    >
                      Resume builder
                    </Link>
                  </div>
                  <p className="text-xs text-slate-500">
                    Review every claim before using AI drafts. Reports cannot
                    guarantee job selection.
                  </p>
                </>
              )}
            </section>
          </div>
        )}
        <section className="border bg-white rounded-2xl p-6">
          <h2 className="font-bold text-xl mb-4">Saved reports</h2>
          <div className="space-y-3">
            {history
              .filter((r) => !tool || r.tool === tool)
              .map((r) => (
                <div className="border-b py-3" key={r._id}>
                  <Link
                    className="text-blue-700 underline"
                    to={`/career/tools/${r.tool}`}
                    onClick={() => {
                      request(`/api/tools/reports/${r._id}`)
                        .then((d) => setReport(d.report))
                        .catch((e) => setError(e.message));
                    }}
                  >
                    {r.title}
                  </Link>
                  <span className="ml-3 text-sm text-slate-500">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    className="ml-3 text-red-700 text-sm"
                    onClick={async () => {
                      if (!window.confirm("Delete this report?")) return;
                      try {
                        await request(`/api/tools/reports/${r._id}`, {
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
              ))}
          </div>
        </section>
      </div>
      {history.length < listTotal && (
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
