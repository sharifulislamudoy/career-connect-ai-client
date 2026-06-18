import React from "react";
import { Navigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";

const ModeratorRoute = ({ children }) => {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth/login" />;
  if (userProfile?.userType !== "moderator" && userProfile?.userType !== "admin")
    return <Navigate to="/" />;

  return children;
};

export default ModeratorRoute;