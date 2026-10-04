import { createElement } from "react";
import { Suspense } from "react";
import { Link, Outlet } from "react-router";
import { MotionConfig } from "framer-motion";
import { FaBriefcase, FaUsers, FaRobot } from "react-icons/fa";
export default function Auth() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="cc-hero min-h-screen px-4 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
          <section className="hidden lg:block sticky top-16 pt-8">
            <Link to="/" className="flex items-center gap-3 font-bold">
              <img src="/Logo.png" className="w-12 h-12" alt="" />
              Creative Career AI
            </Link>
            <h1 className="text-5xl leading-tight font-bold mt-14">
              Big ambitions.
              <br />
              <span className="cc-gradient">Clear next steps.</span>
            </h1>
            <p className="text-gray-500 text-lg leading-relaxed max-w-md mt-5">
              Bring your experience, curiosity and goals. Build the career that
              comes next.
            </p>
            <div className="space-y-5 mt-9">
              {[
                [
                  FaBriefcase,
                  "Explore opportunities",
                  "Discover roles and manage your applications.",
                ],
                [
                  FaUsers,
                  "Build your network",
                  "Connect and share with other professionals.",
                ],
                [
                  FaRobot,
                  "Get career guidance",
                  "Work on your resume, interviews and skills.",
                ],
              ].map(([Icon, title, description]) => (
                <div className="flex items-start gap-4" key={title}>
                  <div className="bg-white border border-blue-100 rounded-xl p-3 text-blue-500">
                    {createElement(Icon)}
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">{title}</h2>
                    <p className="text-sm text-gray-500 mt-1">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="w-full max-w-lg mx-auto cc-enter">
            <Suspense
              fallback={
                <div
                  role="status"
                  className="cc-panel p-12 text-center text-sm text-gray-500"
                >
                  Loading sign in…
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </section>
        </div>
      </div>
    </MotionConfig>
  );
}
