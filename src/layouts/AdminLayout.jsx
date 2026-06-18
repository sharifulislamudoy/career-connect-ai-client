import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { FaUsers, FaCog, FaSignOutAlt, FaTachometerAlt, FaBriefcase } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";

const AdminLayout = () => {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const sidebarItems = [
    { path: "/admin/dashboard", name: "Dashboard", icon: FaTachometerAlt },
    { path: "/admin/users", name: "Users", icon: FaUsers },
    { path: "/admin/jobs", name: "Verify Jobs", icon: FaBriefcase }, // new
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar - 1/4 width */}
      <aside className="w-1/4 bg-white shadow-lg border-r border-gray-200/50 fixed top-0 left-0 h-full overflow-y-auto z-40">
        <div className="p-6">
          {/* Brand */}
          <div className="flex items-center space-x-3 mb-8">
            <img src="/Logo.png" alt="Logo" className="h-10 w-10" />
            <div>
              <h1 className="text-xl font-bold text-blue-500">Admin</h1>
              <span className="text-xs text-gray-500">Dashboard</span>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-2xl mb-6">
            <img
              src={userProfile?.photoURL || "/default-avatar.png"}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {userProfile?.displayName || "User"}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {userProfile?.userType}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {sidebarItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-blue-50 text-blue-600 border border-blue-200/50"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`
                }
              >
                <item.icon className="text-lg" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>

          {/* Logout */}
          <div className="mt-8 pt-6 border-t border-gray-200/50">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content - 3/4 width */}
      <main className="ml-[25%] w-3/4 p-8 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;