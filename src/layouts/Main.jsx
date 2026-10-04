import { useEffect, Suspense } from "react";
import { Outlet, useLocation, Link } from "react-router";
import { MotionConfig } from "framer-motion";
import Navbar from "../shared/Navbar";
import Footer from "../shared/Footer";
import { useAuth } from "../contexts/AuthContext";
export default function Main() {
  const { user, userProfile } = useAuth();
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return (
    <MotionConfig reducedMotion="user">
      <div className={`cc-app ${user ? "is-member" : ""}`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 z-[100] cc-primary"
        >
          Skip to content
        </a>
        <Navbar />
        {user &&
          userProfile &&
          !userProfile.profileCompleted &&
          pathname !== "/settings" && (
            <div className="bg-blue-50 border-b border-blue-100">
              <div className="cc-container py-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>
                  Add your experience and skills to make your profile more
                  useful.
                </span>
                <Link className="font-semibold text-blue-700" to="/settings">
                  Complete profile →
                </Link>
              </div>
            </div>
          )}
        <main id="main-content" tabIndex={-1}>
          <div key={pathname} className="cc-enter">
            <Suspense
              fallback={
                <div
                  role="status"
                  className="cc-container py-20 text-center text-sm text-gray-500"
                >
                  Loading page…
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </div>
        </main>
        <Footer />
      </div>
    </MotionConfig>
  );
}
