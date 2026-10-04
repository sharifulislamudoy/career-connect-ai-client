import { createElement } from "react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router";
import {
  FaHome,
  FaUsers,
  FaComments,
  FaBriefcase,
  FaCog,
  FaTimes,
  FaFileAlt,
  FaVideo,
  FaChartBar,
  FaSignOutAlt,
  FaCrown,
  FaClipboardList,
  FaBookOpen,
  FaPlus,
} from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import NotificationBell from "../components/notification/NotificationBell";
import PwaInstallButton from "../components/pwa/PwaInstallButton";
import toast from "react-hot-toast";
const navigation = [
  ["/", "Feed", FaHome],
  ["/network", "Network", FaUsers],
  ["/jobs", "Jobs", FaBriefcase],
  ["/messages", "Messages", FaComments],
];
export default function Navbar() {
  const { user, userProfile, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const trigger = useRef(null);
  const drawer = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const name = userProfile?.displayName || user?.displayName || "Your profile";
  const photo =
    userProfile?.photoURL || user?.photoURL || "/default-avatar.png";
  const recruiter = userProfile?.userType === "recruiter";
  const admin = ["admin", "moderator"].includes(userProfile?.userType);
  const links = recruiter
    ? [
        ["/post-job", "Post a job", FaPlus],
        ["/my-jobs", "Manage jobs", FaBriefcase],
      ]
    : [
        ["/my-applications", "My applications", FaClipboardList],
        ["/create-resume", "Resume builder", FaFileAlt],
        ["/ats-score", "Resume score", FaChartBar],
        ["/mock-interview", "Interview practice", FaVideo],
        ["/learning-path", "Learning path", FaBookOpen],
      ];
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    const previousTrigger = trigger.current;
    document.body.style.overflow = "hidden";
    drawer.current?.querySelector("button")?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "Tab") {
        const elements = [
          ...drawer.current.querySelectorAll(
            'a[href], button:not([disabled]), [tabindex="0"]',
          ),
        ].filter((el) => el.getClientRects().length);
        const first = elements[0],
          last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
      previousTrigger?.focus();
    };
  }, [open]);
  const signOut = async () => {
    setSigningOut(true);
    try {
      await logout();
      setOpen(false);
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(error.message || "Could not sign out. Try again.");
    } finally {
      setSigningOut(false);
    }
  };
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-gray-200/70 bg-white/95 backdrop-blur-xl">
        <div className="cc-container flex h-[76px] items-center justify-between gap-3">
          <Link
            to="/"
            className="flex items-center gap-2.5 shrink-0"
            aria-label="Creative Career AI home"
          >
            <img src="/Logo.png" alt="" className="h-10 w-10 object-contain" />
            <div>
              <p className="font-bold text-[15px] leading-tight text-gray-900">
                Creative Career <span className="text-blue-600">AI</span>
              </p>
              <p className="text-[10px] tracking-[.16em] text-gray-500 mt-1">
                CONNECT. LEARN. GROW.
              </p>
            </div>
          </Link>
          {user ? (
            <nav aria-label="Main navigation" className="hidden md:flex gap-1">
              {navigation.map(([path, label, Icon]) => (
                <NavLink
                  key={path}
                  end={path === "/"}
                  to={path}
                  className={({ isActive }) =>
                    `cc-navlink ${isActive ? "active" : ""}`
                  }
                >
                  {createElement(Icon)}
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
          ) : (
            <nav
              className="hidden md:flex gap-6 text-sm font-medium text-gray-600"
              aria-label="Main navigation"
            >
              <a href="/#features">Features</a>
              <a href="/#how-it-works">How it works</a>
            </nav>
          )}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <NotificationBell />
                <button
                  ref={trigger}
                  onClick={() => setOpen(true)}
                  aria-label="Open profile menu"
                  aria-expanded={open}
                  aria-controls="profile-drawer"
                  className="rounded-full p-1 border border-gray-200"
                >
                  <img
                    src={photo}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/default-avatar.png";
                    }}
                    className="h-9 w-9 rounded-full object-cover"
                    alt=""
                  />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth/login"
                  className="hidden sm:inline-flex cc-secondary"
                >
                  Sign in
                </Link>
                <Link to="/auth/sign-up" className="cc-primary !px-3 sm:!px-5">
                  Join free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      {user && (
        <nav
          aria-label="Mobile navigation"
          className="cc-mobile-nav md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 z-40"
        >
          <div className="flex h-16">
            {navigation.map(([path, label, Icon]) => (
              <NavLink
                key={path}
                to={path}
                end={path === "/"}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-semibold ${isActive ? "text-blue-600" : "text-gray-500"}`
                }
              >
                {createElement(Icon, { className: "text-lg" })}
                {label}
              </NavLink>
            ))}
            <button
              className="flex-1 flex flex-col items-center justify-center gap-1 text-[10px] text-gray-500"
              onClick={() => setOpen(true)}
            >
              <FaCog className="text-lg" />
              Account
            </button>
          </div>
        </nav>
      )}
      {open && user && (
        <div className="fixed inset-0 z-[80]">
          <div
            className="absolute inset-0 bg-gray-950/35 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside
            ref={drawer}
            id="profile-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-heading"
            className="absolute right-0 inset-y-0 w-full max-w-sm bg-white shadow-2xl flex flex-col cc-enter"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center mb-5">
                <span className="cc-label">Your workspace</span>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close profile menu"
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <FaTimes />
                </button>
              </div>
              <img
                src={photo}
                alt=""
                className="w-16 h-16 rounded-2xl object-cover mb-3"
              />
              <h2 id="profile-heading" className="text-lg font-bold">
                {name}
              </h2>
              <p className="text-sm text-gray-500 mt-1 break-all">
                {user.email}
              </p>
              <span className="inline-block text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full mt-3 capitalize">
                {userProfile?.package || "Basic"} plan
              </span>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              {[
                ...links,
                ["/settings", "Profile & settings", FaCog],
                ["/pricing", "Explore plans", FaCrown],
                ...(admin
                  ? [["/admin/dashboard", "Admin dashboard", FaCog]]
                  : []),
              ].map(([path, label, Icon]) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setOpen(false)}
                  className="cc-drawer-link"
                >
                  {createElement(Icon, { className: "text-blue-500" })}
                  {label}
                </Link>
              ))}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <PwaInstallButton />
              </div>
            </div>
            <div className="p-4 border-t border-gray-100">
              <button
                disabled={signingOut}
                onClick={signOut}
                className="cc-drawer-link w-full text-red-600"
              >
                <FaSignOutAlt />
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
