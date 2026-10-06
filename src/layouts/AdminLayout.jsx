import DemoAccess from "../components/demo/DemoAccess";
import { Outlet, NavLink, Link, useNavigate } from "react-router";
import {
  FaUsers,
  FaSignOutAlt,
  FaTachometerAlt,
  FaBriefcase,
  FaRegFileAlt,
} from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

const sidebarItems = [
  {
    path: "/admin/posts",
    name: "Community posts",
    icon: FaRegFileAlt,
    adminOnly: true,
  },
  {
    path: "/admin/reports",
    name: "Reports & account reviews",
    icon: FaTachometerAlt,
  },
  {
    path: "/admin/dashboard",
    name: "Dashboard",
    icon: FaTachometerAlt,
  },
  {
    path: "/admin/users",
    name: "Users",
    icon: FaUsers,
  },
  {
    path: "/admin/jobs",
    name: "Verify Jobs",
    icon: FaBriefcase,
  },
];

export default function AdminLayout() {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(error.message || "Could not sign out. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      <aside className="border-b border-gray-200 bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div className="p-4 sm:p-6">
          <Link to="/" className="mb-6 flex items-center gap-3">
            <img
              src="/Logo.png"
              alt="Creative Career AI"
              className="h-10 w-10 object-contain"
            />

            <div>
              <p className="text-lg font-bold text-blue-600">Career AI</p>
              <p className="text-xs text-gray-500">Admin workspace</p>
            </div>
          </Link>

          <div className="mb-6 flex items-center gap-3 rounded-xl bg-blue-50 p-3">
            <img
              src={userProfile?.photoURL || "/default-avatar.png"}
              alt=""
              className="h-10 w-10 rounded-full object-cover"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = "/default-avatar.png";
              }}
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-800">
                {userProfile?.displayName || "Your account"}
              </p>
              <p className="text-xs capitalize text-gray-500">
                {userProfile?.userType || "Staff"}
              </p>
            </div>
          </div>

          <nav
            aria-label="Admin navigation"
            className="flex flex-wrap gap-2 lg:flex-col"
          >
            {sidebarItems
              .filter(
                (item) => !item.adminOnly || userProfile?.userType === "admin",
              )
              .map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`
                  }
                >
                  <item.icon aria-hidden="true" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
          </nav>

          <div className="mt-6 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <FaSignOutAlt aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:ml-64 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <DemoAccess />
          <Outlet />
        </div>
      </main>
    </div>
  );
}
