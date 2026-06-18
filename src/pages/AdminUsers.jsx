import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import { FaSpinner, FaUserTag, FaTrash, FaCheck, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";

const AdminUsers = () => {
  const { user, userProfile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState(null); // uid
  const [selectedRole, setSelectedRole] = useState("");

  const isAdmin = userProfile?.userType === "admin";
  const isModerator = userProfile?.userType === "moderator";

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/admin/users`, {
        headers: {
          "x-user-id": user.uid,
        },
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      } else {
        toast.error(data.message || "Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Error loading users");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (uid, newRole) => {
    if (!newRole) return;
    try {
      const response = await fetch(
        `http://localhost:5000/api/admin/users/${uid}/role`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user.uid,
          },
          body: JSON.stringify({ newRole }),
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success("Role updated successfully");
        setUsers((prev) =>
          prev.map((u) => (u.uid === uid ? { ...u, userType: newRole } : u))
        );
        setEditingRole(null);
      } else {
        toast.error(data.message || "Failed to update role");
      }
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Error updating role");
    }
  };

  const handleDeleteUser = async (uid, name) => {
    if (
      !window.confirm(
        `Are you sure you want to delete user "${name}"? This action cannot be undone.`
      )
    )
      return;
    try {
      const response = await fetch(
        `http://localhost:5000/api/admin/users/${uid}`,
        {
          method: "DELETE",
          headers: {
            "x-user-id": user.uid,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success("User deleted");
        setUsers((prev) => prev.filter((u) => u.uid !== uid));
      } else {
        toast.error(data.message || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Error deleting user");
    }
  };

  const canEditRole = (targetUser) => {
    if (isAdmin) return true;
    if (isModerator) {
      const targetRole = targetUser.userType;
      if (targetRole === "admin" || targetRole === "moderator") return false;
      return true;
    }
    return false;
  };

  const canDeleteUser = (targetUser) => {
    if (targetUser.uid === user.uid) return false;
    if (isAdmin) return true;
    if (isModerator) {
      const targetRole = targetUser.userType;
      if (targetRole === "admin" || targetRole === "moderator") return false;
      return true;
    }
    return false;
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "moderator":
        return "bg-purple-100 text-purple-800";
      case "recruiter":
        return "bg-green-100 text-green-800";
      case "jobSeeker":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin text-3xl text-blue-500" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <span className="text-sm text-gray-500">Total users: {users.length}</span>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-gray-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 border-b border-gray-200/50">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-gray-600">User</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-600">Email</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-600">Role</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.uid} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 flex items-center space-x-3">
                    <img
                      src={u.photoURL || "/default-avatar.png"}
                      alt={u.displayName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="font-medium text-gray-800">
                      {u.displayName || "No Name"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{u.email}</td>
                  <td className="px-6 py-4">
                    {editingRole === u.uid ? (
                      <div className="flex items-center space-x-2">
                        <select
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value)}
                          className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="jobSeeker">Job Seeker</option>
                          <option value="recruiter">Recruiter</option>
                          {isAdmin && (
                            <>
                              <option value="moderator">Moderator</option>
                              <option value="admin">Admin</option>
                            </>
                          )}
                        </select>
                        <button
                          onClick={() => handleRoleChange(u.uid, selectedRole)}
                          className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                        >
                          <FaCheck />
                        </button>
                        <button
                          onClick={() => setEditingRole(null)}
                          className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                          u.userType
                        )}`}
                      >
                        {u.userType || "jobSeeker"}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {canEditRole(u) && (
                        <button
                          onClick={() => {
                            setEditingRole(u.uid);
                            setSelectedRole(u.userType || "jobSeeker");
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Change Role"
                        >
                          <FaUserTag />
                        </button>
                      )}
                      {canDeleteUser(u) && (
                        <button
                          onClick={() =>
                            handleDeleteUser(u.uid, u.displayName || u.email)
                          }
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminUsers;