import { createElement, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FaTimes, FaSearch } from "react-icons/fa";

export function Avatar({ person, className = "h-12 w-12" }) {
  return (
    <img
      src={person?.photoURL || "/default-avatar.png"}
      alt=""
      className={`${className} shrink-0 rounded-2xl object-cover bg-blue-50`}
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = "/default-avatar.png";
      }}
    />
  );
}
export function PageHeading({ eyebrow, title, description, children }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-blue-600">
          {eyebrow}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500">
          {description}
        </p>
      </div>
      {children}
    </header>
  );
}
export function SearchField({
  value,
  onChange,
  placeholder,
  label = "Search",
}) {
  return (
    <div className="relative min-w-0 flex-1">
      <FaSearch
        aria-hidden
        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
      />
      <input
        aria-label={label}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm"
      />
    </div>
  );
}
export function EmptyState({
  icon: Icon = FaSearch,
  title,
  description,
  children,
}) {
  return (
    <div className="cc-panel px-5 py-14 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-500">
        {createElement(Icon, { "aria-hidden": true })}
      </div>
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
        {description}
      </p>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
export function CardsLoading({ count = 6 }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="cc-panel animate-pulse p-5">
          <div className="mb-5 h-14 w-14 rounded-2xl bg-blue-50" />
          <div className="mb-3 h-4 w-3/4 rounded bg-gray-100" />
          <div className="mb-6 h-3 w-1/2 rounded bg-gray-100" />
          <div className="h-10 rounded-xl bg-gray-100" />
        </div>
      ))}
    </div>
  );
}
export function ErrorBanner({ error, onRetry }) {
  if (!error) return null;
  return (
    <div
      role="alert"
      className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
    >
      <span>{error}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 font-bold underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}
export function Dialog({ title, onClose, children, footer, busy = false }) {
  const panel = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    const keydown = (e) => {
      if (e.key === "Escape" && !busy) closeRef.current();
      if (e.key !== "Tab") return;
      const items = [
        ...panel.current.querySelectorAll(
          'button:not(:disabled), a[href], input, textarea, select, [tabindex="0"]',
        ),
      ];
      if (!items.length) {
        e.preventDefault();
        return;
      }
      const first = items[0],
        last = items[items.length - 1];
      if (
        e.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === panel.current)
      ) {
        e.preventDefault();
        last.focus();
      } else if (
        !e.shiftKey &&
        (document.activeElement === last ||
          document.activeElement === panel.current)
      ) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", keydown);
      previous?.focus();
    };
  }, [busy]);
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/50 p-3 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <section
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-gray-100 p-5">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            aria-label="Close dialog"
            disabled={busy}
            onClick={onClose}
            className="rounded-xl p-3 text-gray-500 hover:bg-gray-100"
          >
            <FaTimes />
          </button>
        </header>
        <div className="overflow-y-auto p-5 sm:p-6">{children}</div>
        {footer && (
          <footer className="flex flex-wrap justify-end gap-3 border-t border-gray-100 p-5">
            {footer}
          </footer>
        )}
      </section>
    </div>,
    document.body,
  );
}
