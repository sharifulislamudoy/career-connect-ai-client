import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router";
import { FaRobot, FaTimes } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import AICoachWidget from "./AICoachWidget";

export default function MobileCareerCoach() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [navHeight, setNavHeight] = useState(null);
  const trigger = useRef(null);
  const dialog = useRef(null);

  useEffect(() => {
    const nav = document.querySelector(".cc-mobile-nav");
    if (!nav) return;
    const measure = () => setNavHeight(nav.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [user?.uid]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () => [...dialog.current.querySelectorAll(
      'button:not(:disabled), a[href], input:not(:disabled), [tabindex="0"]',
    )].filter((element) => element.getClientRects().length);
    focusable()[0]?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab") return;
      const elements = focusable();
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    const desktop = window.matchMedia("(min-width: 1280px)");
    const onDesktop = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener("change", onDesktop);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onDesktop);
      if (previous?.isConnected) previous.focus();
    };
  }, [open]);

  return createPortal(
    <>
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open AI Career Coach"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? "mobile-career-coach" : undefined}
        style={{ bottom: navHeight ? navHeight + 12 : "calc(82px + env(safe-area-inset-bottom))" }}
        className="xl:hidden fixed right-4 z-50 flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-xl shadow-blue-600/25 hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
      >
        <FaRobot aria-hidden="true" className="text-lg" /> AI Coach
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/50 sm:items-center sm:p-4"
          onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }}
        >
          <div
            ref={dialog}
            id="mobile-career-coach"
            role="dialog"
            aria-modal="true"
            aria-label="AI Career Coach"
            style={{ paddingBottom: "env(safe-area-inset-bottom)", paddingTop: "env(safe-area-inset-top)" }}
            className="flex h-[100dvh] w-full flex-col bg-white sm:h-[min(700px,90dvh)] sm:max-w-md sm:rounded-2xl sm:overflow-hidden"
          >
            {user ? (
              <AICoachWidget onClose={() => setOpen(false)} className="h-full max-h-none rounded-none border-0 shadow-none sm:rounded-2xl" />
            ) : (
              <div className="flex h-full flex-col p-6">
                <button type="button" onClick={() => setOpen(false)} aria-label="Close career coach" className="self-end rounded-lg p-3 text-slate-500"><FaTimes /></button>
                <div className="my-auto text-center">
                  <FaRobot className="mx-auto mb-5 text-5xl text-blue-600" />
                  <h2 className="text-xl font-bold">Meet your AI Career Coach</h2>
                  <p className="mt-3 text-sm text-slate-500">Sign in for guidance on your resume, interviews and matching jobs.</p>
                  <Link to="/auth/login" onClick={() => setOpen(false)} className="cc-primary mt-6">Sign in to chat</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>, document.body,
  );
}
