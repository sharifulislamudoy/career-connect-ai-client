import { createElement } from "react";
import { Link } from "react-router";
import {
  FaArrowRight,
  FaBriefcase,
  FaUsers,
  FaFileAlt,
  FaCheck,
  FaLock,
  FaRobot,
  FaGraduationCap,
} from "react-icons/fa";
const features = [
  [
    FaBriefcase,
    "Find your next opportunity",
    "Explore jobs, review the details and keep track of your applications.",
    "/jobs",
  ],
  [
    FaUsers,
    "Build meaningful connections",
    "Meet professionals, exchange ideas and grow your network.",
    "/network",
  ],
  [
    FaRobot,
    "Move forward with AI",
    "Ask your career coach for guidance based on your profile and goals.",
    "/",
  ],
  [
    FaFileAlt,
    "Tell your story better",
    "Build your resume, check its ATS score and prepare for interviews.",
    "/create-resume",
  ],
];
export default function HeroSection() {
  return (
    <>
      <section className="cc-hero border-b border-gray-200/60">
        <div className="cc-container grid lg:grid-cols-2 gap-12 lg:gap-16 items-center py-16 sm:py-24">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-blue-100 text-xs font-semibold text-blue-700">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Your career, connected
            </span>
            <h1 className="text-[42px] sm:text-6xl xl:text-[68px] font-bold leading-[1.08] mt-6 text-gray-950">
              Your next chapter
              <br />
              <span className="cc-gradient">starts here.</span>
            </h1>
            <p className="text-base sm:text-lg leading-relaxed text-gray-500 mt-6 max-w-lg">
              A space for your ambitions. Connect with professionals, discover
              opportunities and turn career goals into a clear next step.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link to="/auth/sign-up" className="cc-primary">
                Create your free account <FaArrowRight />
              </Link>
              <Link to="/auth/login" className="cc-secondary">
                Sign in
              </Link>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-5 text-xs text-gray-500">
              <span className="flex items-center gap-2">
                <FaCheck className="text-blue-500" />
                Free to get started
              </span>
              <span className="flex items-center gap-2">
                <FaLock />
                Member-only workspace
              </span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-blue-100/30 blur-3xl rounded-full pointer-events-none" />
            <div className="relative cc-panel p-5 sm:p-7">
              <div className="flex justify-between items-center border-b border-gray-100 pb-5">
                <div className="flex items-center gap-3">
                  <img src="/Logo.png" className="w-10 h-10" alt="" />
                  <div>
                    <p className="font-semibold text-sm">
                      Your career workspace
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Everything you need, in one place
                    </p>
                  </div>
                </div>
                <span className="bg-blue-50 text-blue-600 text-[10px] font-semibold px-2 py-1 rounded-full">
                  PREVIEW
                </span>
              </div>
              <div className="mt-6 rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50 p-5">
                <span className="cc-label">A little progress, every day</span>
                <h2 className="text-2xl font-semibold mt-2">
                  Make your next move.
                </h2>
                <p className="text-sm text-gray-500 mt-2">
                  Your profile. Your network. Your possibilities.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {[
                  [FaBriefcase, "Opportunities", "Explore new roles"],
                  [FaUsers, "Your network", "Connect with people"],
                  [FaFileAlt, "Your resume", "Show your strengths"],
                  [FaGraduationCap, "Learning", "Build useful skills"],
                ].map(([Icon, title, description]) => (
                  <div
                    key={title}
                    className="border border-gray-100 rounded-xl p-4"
                  >
                    {createElement(Icon, { className: "text-blue-500 mb-3" })}
                    <p className="font-semibold text-sm">{title}</p>
                    <p className="text-xs text-gray-500 mt-1">{description}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 items-center rounded-xl border border-gray-100 mt-4 p-4">
                <FaLock className="text-violet-500 shrink-0" />
                <p className="text-xs text-gray-500 leading-relaxed">
                  Sign in to see your feed, job details, connections and
                  personal career tools.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="features" className="cc-container py-16 scroll-mt-24">
        <div className="max-w-xl">
          <p className="cc-label">Built around your growth</p>
          <h2 className="text-3xl sm:text-4xl font-bold mt-3">
            Less searching.
            <br />
            More moving forward.
          </h2>
          <p className="text-gray-500 mt-4 leading-relaxed">
            Get a simple introduction here. Unlock the full experience when you
            join.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {features.map(([Icon, title, description, path]) => (
            <article key={title} className="cc-panel p-6 flex flex-col">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                {createElement(Icon)}
              </div>
              <h3 className="font-semibold text-lg leading-snug mt-5">
                {title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed mt-3 mb-6">
                {description}
              </p>
              <Link
                to="/auth/sign-up"
                state={{ from: { pathname: path } }}
                className="text-blue-600 font-semibold text-sm flex items-center gap-2 mt-auto"
              >
                Unlock with an account <FaArrowRight className="text-xs" />
              </Link>
            </article>
          ))}
        </div>
      </section>
      <section id="how-it-works" className="cc-container pb-16 scroll-mt-24">
        <div className="cc-panel p-7 sm:p-10">
          <h2 className="text-2xl sm:text-3xl font-bold">
            A clearer path to what comes next.
          </h2>
          <div className="grid md:grid-cols-3 gap-7 mt-8">
            {[
              [
                "01",
                "Create your profile",
                "Add your experience, skills and the kind of work you want.",
              ],
              [
                "02",
                "Explore and connect",
                "Discover opportunities and start conversations with your network.",
              ],
              [
                "03",
                "Keep improving",
                "Use career tools to refine your resume and prepare your next move.",
              ],
            ].map(([n, title, description]) => (
              <div key={n}>
                <span className="text-blue-500 font-mono text-sm">{n}</span>
                <h3 className="font-semibold mt-3">{title}</h3>
                <p className="text-sm leading-relaxed text-gray-500 mt-2">
                  {description}
                </p>
              </div>
            ))}
          </div>
          <Link to="/auth/sign-up" className="cc-primary mt-8">
            Start your journey <FaArrowRight />
          </Link>
        </div>
      </section>
    </>
  );
}
