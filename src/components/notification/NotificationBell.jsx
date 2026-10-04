import { Link } from "react-router";
import { FaBell } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContext";

export default function NotificationBell() {
  const { user } = useAuth();
  const { unreadCount, loading } = useNotifications();

  if (!user) return null;

  const count = Math.max(0, Number(unreadCount) || 0);

  const label =
    count > 0
      ? `Notifications, ${count} unread`
      : "Notifications";

  return (
    <Link
      to="/notifications"
      aria-label={label}
      title={label}
      className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
    >
      <FaBell
        aria-hidden="true"
        className="text-lg"
      />

      {!loading && count > 0 && (
        <span
          aria-hidden="true"
          className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-blue-600 px-1 text-[10px] font-bold leading-none text-white"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}

      <span
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {loading
          ? "Loading notifications"
          : count > 0
            ? `${count} unread notifications`
            : "No unread notifications"}
      </span>
    </Link>
  );
}