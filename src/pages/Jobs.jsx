import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  FaBriefcase,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaArrowRight,
  FaClock,
  FaSlidersH,
} from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import { request } from "../lib/api";
import {
  PageHeading,
  SearchField,
  EmptyState,
  CardsLoading,
  ErrorBanner,
} from "../components/community/CommunityUI";

import { shortDate } from "../components/community/communityUtils";

const types = ["Full-time", "Part-time", "Contract", "Remote", "Internship"];
const levels = ["Entry", "Junior", "Mid", "Senior", "Lead"];
const defaults = { location: "", type: "", experience: "" };
export default function Jobs() {
  const { user, userProfile } = useAuth();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(defaults);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({
    jobs: [],
    pagination: { total: 0, totalPages: 1 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      page,
      limit: 12,
      search: query,
      ...filters,
    });
    if (user?.uid) params.set("userId", user.uid);
    request(`/api/jobs?${params}`, { signal: controller.signal })
      .then((data) => {
        if (!data.success)
          throw new Error(data.message || "Jobs could not be loaded.");
        if (!controller.signal.aborted) setResult(data);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [query, filters, page, user?.uid, reload]);
  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };
  const reset = () => {
    setSearch("");
    setQuery("");
    setFilters(defaults);
    setPage(1);
  };
  const activeCount = Object.values(filters).filter(Boolean).length;
  const total = result.pagination?.total || 0;
  const pages = Math.max(1, result.pagination?.totalPages || 1);
  return (
    <div className="cc-container py-7 sm:py-10">
      <PageHeading
        eyebrow="Your next chapter"
        title="Work that moves you forward."
        description="Explore opportunities, narrow down your search and find a role worth applying for."
      >
        <div className="flex gap-2">
          <Link to="/my-applications" className="cc-secondary">
            My applications
          </Link>
          {userProfile?.userType === "recruiter" && (
            <Link to="/post-job" className="cc-primary">
              Post a job
            </Link>
          )}
        </div>
      </PageHeading>
      <section
        className="cc-panel mb-6 p-4 sm:p-5"
        aria-label="Job search and filters"
      >
        <div className="flex gap-3">
          <SearchField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Job title, company or keyword"
            label="Search jobs"
          />
          <button
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            aria-controls="job-filters"
            className="cc-secondary"
          >
            <FaSlidersH />
            <span className="hidden sm:inline">Filters</span>
            {activeCount > 0 && (
              <span className="rounded-full bg-blue-600 px-2 text-xs text-white">
                {activeCount}
              </span>
            )}
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold text-gray-400">
            EXPLORE
          </span>
          {["", ...types].map((type) => (
            <button
              key={type}
              aria-pressed={filters.type === type}
              onClick={() => updateFilter("type", type)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${filters.type === type ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-600 hover:bg-blue-50"}`}
            >
              {type || "All roles"}
            </button>
          ))}
        </div>
        <div
          id="job-filters"
          className={`${showFilters ? "grid" : "hidden"} mt-5 gap-4 border-t border-gray-100 pt-5 sm:grid-cols-3`}
        >
          <label className="text-xs font-semibold text-gray-600">
            Location
            <input
              value={filters.location}
              onChange={(e) => updateFilter("location", e.target.value)}
              placeholder="City or country"
              className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm"
            />
          </label>
          <label className="text-xs font-semibold text-gray-600">
            Job type
            <select
              value={filters.type}
              onChange={(e) => updateFilter("type", e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm"
            >
              <option value="">All types</option>
              {types.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-gray-600">
            Experience
            <select
              value={filters.experience}
              onChange={(e) => updateFilter("experience", e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm"
            >
              <option value="">All levels</option>
              {levels.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
        </div>
        {(query || activeCount > 0) && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            {Object.entries(filters)
              .filter(([, v]) => v)
              .map(([key, v]) => (
                <button
                  key={key}
                  onClick={() => updateFilter(key, "")}
                  aria-label={`Remove ${key} filter`}
                  className="rounded-lg bg-blue-50 px-3 py-2 text-blue-700"
                >
                  {v} ×
                </button>
              ))}
            <button
              onClick={reset}
              className="px-2 py-2 font-semibold text-gray-500 underline"
            >
              Clear search & filters
            </button>
          </div>
        )}
      </section>
      <ErrorBanner error={error} onRetry={() => setReload((v) => v + 1)} />
      <div className="mb-4 flex items-center justify-between gap-4">
        <p aria-live="polite" className="text-sm font-semibold text-gray-700">
          {loading
            ? "Finding opportunities…"
            : `${total} ${total === 1 ? "opportunity" : "opportunities"}`}
        </p>
        <span className="text-xs text-gray-500">
          Relevant to your profile • newest first
        </span>
      </div>
      {loading ? (
        <CardsLoading />
      ) : error ? null : !result.jobs.length ? (
        <EmptyState
          icon={FaBriefcase}
          title="No matching roles yet"
          description="Try a broader keyword, a different location or fewer filters."
        >
          <button onClick={reset} className="cc-primary">
            See all opportunities
          </button>
        </EmptyState>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {result.jobs.map((job) => {
              const expired =
                job.applicationDeadline &&
                new Date(job.applicationDeadline).getTime() < Date.now();
              return (
                <article
                  key={job._id}
                  className="cc-panel cc-enter flex min-w-0 flex-col p-5 transition hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/40"
                >
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-xl font-bold text-blue-600">
                      {String(job.company || "C")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <span className="rounded-lg bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
                      {job.type || "Opportunity"}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold leading-6 text-gray-900">
                    <Link
                      to={`/job/${job._id}`}
                      className="hover:text-blue-600"
                    >
                      {job.title}
                    </Link>
                  </h2>
                  <p className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                    {job.company}
                    {job.isVerified && (
                      <FaCheckCircle
                        title="Verified company"
                        className="shrink-0 text-blue-500"
                      />
                    )}
                  </p>
                  <div className="my-4 flex flex-wrap gap-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5 rounded-lg border border-gray-100 px-2 py-2">
                      <FaMapMarkerAlt />
                      {job.location || "Location not specified"}
                    </span>
                    {job.experience && (
                      <span className="rounded-lg border border-gray-100 px-2 py-2">
                        {job.experience} level
                      </span>
                    )}
                  </div>
                  <p className="mb-5 line-clamp-2 text-sm leading-6 text-gray-500">
                    {String(
                      job.description ||
                        "Open this role to see the requirements and application details.",
                    ).replace(/<[^>]*>/g, "")}
                  </p>
                  <div className="mt-auto">
                    <p className="mb-4 font-semibold text-blue-700">
                      {job.salary || "Salary not specified"}
                    </p>
                    <div className="mb-4 flex flex-wrap justify-between gap-2 border-t border-gray-100 pt-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <FaClock />
                        {shortDate(job.createdAt)}
                      </span>
                      {job.applicationDeadline && (
                        <span className={expired ? "text-red-500" : ""}>
                          {expired
                            ? "Deadline passed"
                            : `Closes ${shortDate(job.applicationDeadline)}`}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link
                        to={`/job/${job._id}`}
                        className="cc-secondary flex-1"
                      >
                        Details
                      </Link>
                      {expired ? (
                        <span className="cc-secondary flex-1 text-gray-400">
                          Closed
                        </span>
                      ) : (
                        <Link
                          to={`/apply/${job._id}`}
                          className="cc-primary flex-1"
                        >
                          Apply <FaArrowRight />
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          {pages > 1 && (
            <nav
              aria-label="Job result pages"
              className="mt-7 flex items-center justify-center gap-3"
            >
              <button
                disabled={page <= 1}
                onClick={() => setPage((v) => v - 1)}
                className="cc-secondary disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                {page} / {pages}
              </span>
              <button
                disabled={page >= pages}
                onClick={() => setPage((v) => v + 1)}
                className="cc-secondary disabled:opacity-40"
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
