import { createElement } from "react";
import { useState } from "react";
import { Link } from "react-router";
import {
  FaArrowRight,
  FaRobot,
  FaBriefcase,
  FaFileAlt,
  FaUsers,
  FaTimes,
} from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import FeedContent from "./FeedContent";
import AICoachWidget from "./AICoachWidget";
export default function FeedSection() {
  const { user, userProfile } = useAuth();
  const [coachOpen, setCoachOpen] = useState(false);
  const name = userProfile?.displayName || user?.displayName || "there";
  const recruiter = userProfile?.userType === "recruiter";
  return (
    <div className="cc-container py-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="cc-label">Your workspace</p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-2">
            Welcome back, {name.split(" ")[0]}.
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Stay connected. Make your next move.
          </p>
        </div>
        <Link to={recruiter ? "/post-job" : "/jobs"} className="cc-primary">
          <FaBriefcase />
          {recruiter ? "Post a job" : "Explore opportunities"}
          <FaArrowRight className="text-xs" />
        </Link>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_310px] items-start gap-5">
        <aside className="hidden lg:block space-y-4 sticky top-24">
          <div className="cc-panel overflow-hidden">
            <div className="h-20 bg-gradient-to-r from-blue-500 via-blue-600 to-violet-500" />
            <div className="px-5 pb-5">
              <img
                src={
                  userProfile?.photoURL ||
                  user?.photoURL ||
                  "/default-avatar.png"
                }
                alt=""
                className="w-16 h-16 -mt-8 border-4 border-white rounded-2xl object-cover relative"
              />
              <h2 className="font-bold mt-3">{name}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {userProfile?.profession || "Add your professional headline"}
              </p>
              {userProfile?.location && (
                <p className="text-xs text-gray-400 mt-2">
                  {userProfile.location}
                </p>
              )}
              <Link
                to="/settings"
                className="cc-secondary w-full mt-5 !text-xs"
              >
                View & edit profile
              </Link>
            </div>
          </div>
          <div className="cc-panel p-3">
            {[
              [
                recruiter ? "/my-jobs" : "/my-applications",
                recruiter ? "Manage jobs" : "My applications",
                FaBriefcase,
              ],
              ["/network", "Grow your network", FaUsers],
              ["/create-resume", "Resume builder", FaFileAlt],
            ].map(([path, label, Icon]) => (
              <Link key={path} to={path} className="cc-drawer-link !text-xs">
                {createElement(Icon, { className: "text-blue-500" })}
                {label}
              </Link>
            ))}
          </div>
          <div className="cc-panel p-5">
            <p className="cc-label">Next small step</p>
            <p className="text-sm text-gray-500 leading-relaxed mt-3">
              {userProfile?.profileCompleted
                ? "Keep your skills and experience up to date."
                : "Complete your profile so your experience can stand out."}
            </p>
            <Link
              to="/settings"
              className="inline-flex items-center gap-2 text-xs text-blue-600 font-semibold mt-4"
            >
              Update profile <FaArrowRight />
            </Link>
          </div>
        </aside>
        <section className="min-w-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-sm">Your community feed</h2>
            <span className="text-xs text-gray-400">For you</span>
          </div>
          <FeedContent />
        </section>
        <aside className="hidden xl:block sticky top-24 min-w-0">
          <AICoachWidget />
        </aside>
      </div>
      <button
        onClick={() => setCoachOpen((v) => !v)}
        aria-expanded={coachOpen}
        aria-controls="mobile-career-coach"
        className="xl:hidden fixed right-4 bottom-20 md:bottom-6 z-40 cc-primary shadow-lg"
      >
        <FaRobot />
        Career coach
      </button>
      {coachOpen && (
        <div
          className="xl:hidden fixed inset-0 z-[70] bg-gray-950/40 backdrop-blur-sm flex justify-end"
          onClick={() => setCoachOpen(false)}
        >
          <section
            id="mobile-career-coach"
            role="dialog"
            aria-modal="true"
            aria-label="Career coach"
            className="w-full sm:max-w-md h-full overflow-y-auto bg-white p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              autoFocus
              onClick={() => setCoachOpen(false)}
              className="cc-secondary mb-4"
            >
              <FaTimes />
              Close coach
            </button>
            <AICoachWidget onClose={() => setCoachOpen(false)} />
          </section>
        </div>
      )}
    </div>
  );
}
