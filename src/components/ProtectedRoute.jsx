import { Navigate, useLocation } from "react-router";
import { useAuth } from "../contexts/AuthContext";
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div role="status" className="p-16 text-center text-gray-500">Opening your workspace…</div>;
  return user ? children : <Navigate to="/auth/login" state={{ from: location }} replace />;
}
