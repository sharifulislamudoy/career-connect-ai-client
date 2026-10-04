import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaCheckCircle, FaDownload, FaTimes } from 'react-icons/fa';
import { usePwaInstall } from '../../hooks/usePwaInstall';

function InstallHelp({ onClose, canInstall, onInstall, installing }) {
  const panelRef = useRef(null);
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
      if (event.key === 'Tab') {
        const controls = panelRef.current?.querySelectorAll('button:not([disabled]), a[href]');
        if (!controls?.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panelRef.current)) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKey, true);
    return () => {
      document.removeEventListener('keydown', handleKey, true);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <section ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="pwa-help-title" aria-describedby="pwa-help-description"
        tabIndex={-1} onClick={(event) => event.stopPropagation()}
        className="relative max-h-[85dvh] w-full max-w-sm overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl outline-none">
        <button type="button" onClick={onClose} aria-label="Close install instructions"
          className="absolute right-3 top-3 rounded-xl p-3 text-gray-500 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-blue-600">
          <FaTimes aria-hidden="true" />
        </button>
        <img src="/icons/icon-192.png" alt="" className="mb-4 h-16 w-16 rounded-2xl" />
        <h2 id="pwa-help-title" className="text-xl font-bold text-gray-900">Install Career AI</h2>
        <p id="pwa-help-description" className="mt-2 text-sm leading-6 text-gray-600">Add the app to your home screen for quick access.</p>
        {canInstall ? (
          <button type="button" disabled={installing} onClick={onInstall}
            className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-60">
            {installing ? 'Opening installer...' : 'Install app'}
          </button>
        ) : isIos ? (
          <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-6 text-gray-700">
            <li>Open this website in Safari.</li>
            <li>Tap the Share button. You may need to open the browser menu first.</li>
            <li>Select <strong>Add to Home Screen</strong>. Keep <strong>Open as Web App</strong> enabled if shown.</li>
            <li>Tap <strong>Add</strong>, then open Career AI from your home screen.</li>
          </ol>
        ) : (
          <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-6 text-gray-700">
            <li>Open this website in Chrome or Edge outside an in-app browser.</li>
            <li>Open the browser menu and look for <strong>Install app</strong>, <strong>Install this site as an app</strong>, or <strong>Add to Home screen</strong>.</li>
            <li>Confirm the installation. On desktop, an install icon may also appear beside the address bar.</li>
          </ol>
        )}
        <p className="mt-4 text-xs leading-5 text-gray-500">If the install option is missing, check that you are online, use the HTTPS website, and reload once. If already installed, open the app from your home screen or app launcher.</p>
        <button type="button" onClick={onClose}
          className="mt-5 w-full rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-200 focus-visible:outline-2 focus-visible:outline-blue-600">Got it</button>
      </section>
    </div>,
    document.body
  );
}

export default function PwaInstallButton() {
  const { installed, canInstall, installing, install } = usePwaInstall();
  const [showHelp, setShowHelp] = useState(false);
  const [message, setMessage] = useState('');
  // Stable callback keeps the dialog's focus effect from running on every render.
  const closeHelp = useRef(() => setShowHelp(false)).current;

  const handleInstall = async () => {
    setMessage('');
    const result = await install();
    if (result === 'manual') setShowHelp(true);
    else if (result === 'accepted') {
      setShowHelp(false);
      setMessage('Installation accepted. Your browser will finish adding the app.');
    } else if (result === 'dismissed') {
      setShowHelp(false);
      setMessage('You can install later from this button or your browser menu.');
    }
  };

  return (
    <div className="mb-6">
      <button type="button" onClick={handleInstall} disabled={installed || installing}
        className="flex w-full items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-left text-blue-700 transition-colors hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:cursor-default disabled:opacity-75">
        {installed ? <FaCheckCircle className="shrink-0 text-lg" aria-hidden="true" /> : <FaDownload className="shrink-0 text-lg" aria-hidden="true" />}
        <span className="min-w-0">
          <span className="block text-sm font-semibold">{installed ? 'App installed' : installing ? 'Opening installer...' : 'Install App'}</span>
          <span className="mt-0.5 block text-xs text-blue-600">{installed ? 'Creative Career AI is ready' : 'Add Career AI to your home screen'}</span>
        </span>
      </button>
      <p role="status" aria-live="polite" className={message && !installed ? 'mt-2 text-xs leading-5 text-gray-500' : 'sr-only'}>
        {installed ? 'App installed' : message}
      </p>
      {showHelp && !installed && <InstallHelp onClose={closeHelp} canInstall={canInstall} onInstall={handleInstall} installing={installing} />}
    </div>
  );
}
