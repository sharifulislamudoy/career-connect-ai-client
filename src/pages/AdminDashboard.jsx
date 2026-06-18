import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import {
  FaUsers,
  FaBriefcase,
  FaNewspaper,
  FaCreditCard,
  FaVideo,
  FaUserCheck,
  FaSpinner,
} from "react-icons/fa";
import toast from "react-hot-toast";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5000/api/admin/dashboard`,
        {
          headers: {
            "x-user-id": user.uid,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
        setRecent(data.recent);
      } else {
        toast.error(data.message || "Failed to load dashboard");
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      toast.error("Error loading dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-gray-500">
        No data available
      </div>
    );
  }

  // Card data
  const cards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: FaUsers,
      color: "bg-blue-500",
    },
    {
      title: "Total Jobs",
      value: stats.totalJobs,
      icon: FaBriefcase,
      color: "bg-green-500",
    },
    {
      title: "Active Jobs",
      value: stats.totalActiveJobs,
      icon: FaBriefcase,
      color: "bg-emerald-500",
    },
    {
      title: "Total Posts",
      value: stats.totalPosts,
      icon: FaNewspaper,
      color: "bg-purple-500",
    },
    {
      title: "Total Payments",
      value: stats.totalPayments,
      icon: FaCreditCard,
      color: "bg-yellow-500",
    },
    {
      title: "Subscribed Users",
      value: stats.totalSubscribedUsers,
      icon: FaUserCheck,
      color: "bg-indigo-500",
    },
    {
      title: "Interviews",
      value: stats.totalInterviews,
      icon: FaVideo,
      color: "bg-red-500",
    },
  ];

  // User roles breakdown
  const roleEntries = Object.entries(stats.usersByRole || {});
  // Job status breakdown
  const statusEntries = Object.entries(stats.jobsByStatus || {});

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 flex items-center justify-between"
          >
            <div>
              <p className="text-sm text-gray-500 font-medium">
                {card.title}
              </p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {card.value}
              </p>
            </div>
            <div className={`p-3 rounded-full text-white ${card.color}`}>
              <card.icon className="text-xl" />
            </div>
          </div>
        ))}
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Users by Role */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Users by Role
          </h2>
          {roleEntries.length === 0 ? (
            <p className="text-gray-500">No data</p>
          ) : (
            <div className="space-y-2">
              {roleEntries.map(([role, count]) => (
                <div
                  key={role}
                  className="flex justify-between items-center border-b border-gray-100 py-2"
                >
                  <span className="capitalize text-gray-700">
                    {role || "Unknown"}
                  </span>
                  <span className="font-semibold text-gray-800">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Jobs by Status */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Jobs by Status
          </h2>
          {statusEntries.length === 0 ? (
            <p className="text-gray-500">No data</p>
          ) : (
            <div className="space-y-2">
              {statusEntries.map(([status, count]) => (
                <div
                  key={status}
                  className="flex justify-between items-center border-b border-gray-100 py-2"
                >
                  <span className="capitalize text-gray-700">
                    {status || "Unknown"}
                  </span>
                  <span className="font-semibold text-gray-800">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recent Users */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Recent Users
          </h2>
          {recent?.users?.length ? (
            <ul className="space-y-3">
              {recent.users.map((u) => (
                <li key={u.uid} className="flex items-center space-x-3">
                  <img
                    src={u.photoURL || "/default-avatar.png"}
                    alt={u.displayName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {u.displayName || "No Name"}
                    </p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No recent users</p>
          )}
        </div>

        {/* Recent Jobs */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Recent Jobs
          </h2>
          {recent?.jobs?.length ? (
            <ul className="space-y-3">
              {recent.jobs.map((job) => (
                <li key={job._id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {job.title}
                    </p>
                    <p className="text-xs text-gray-500">{job.company}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      job.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {job.status || "draft"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No recent jobs</p>
          )}
        </div>

        {/* Recent Posts */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Recent Posts
          </h2>
          {recent?.posts?.length ? (
            <ul className="space-y-3">
              {recent.posts.map((post) => (
                <li key={post._id}>
                  <p className="text-sm text-gray-800 line-clamp-2">
                    {post.content}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {post.userEmail || "Unknown"}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No recent posts</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;