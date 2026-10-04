import { Link } from "react-router";
import { useAuth } from "../contexts/AuthContext";
export default function Footer() {
  const { user } = useAuth();
  return (
    <footer className="border-t border-gray-200/70 bg-white">
      <div className="cc-container py-7 flex flex-wrap justify-between items-center gap-5">
        <Link to="/" className="flex items-center gap-2 font-semibold text-sm">
          <img src="/Logo.png" alt="" className="w-7 h-7" />
          Creative Career AI
        </Link>
        <p className="text-xs text-gray-500">
          © {new Date().getFullYear()} Creative Career AI. Build your next
          chapter.
        </p>
        <div className="flex gap-4 text-xs text-gray-500">
          {user ? (
            <>
              <Link to="/settings">Settings</Link>
              <Link to="/jobs">Explore jobs</Link>
            </>
          ) : (
            <>
              <Link to="/auth/login">Sign in</Link>
              <Link to="/auth/sign-up">Join the community</Link>
            </>
          )}
        </div>
      </div>
    </footer>
  );
}
