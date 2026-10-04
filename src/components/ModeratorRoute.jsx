import { Navigate, useLocation } from "react-router";
import { useAuth } from "../contexts/AuthContext";

export default function ModeratorRoute({ children }) {
  const { user, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        role="status"
        className="min-h-screen flex items-center justify-center text-sm text-gray-500"
      >
        Opening admin workspace…
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/auth/login"
        state={{ from: location }}
        replace
      />
    );
  }

  const hasAccess = ["admin", "moderator"].includes(
    userProfile?.userType
  );

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return children;
}