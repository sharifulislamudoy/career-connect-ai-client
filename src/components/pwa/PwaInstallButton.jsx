import { useState } from "react";
import {
  FaCheckCircle,
  FaDownload,
  FaTimes,
} from "react-icons/fa";
import { usePwaInstall } from "../../hooks/usePwaInstall";

export default function PwaInstallButton() {
  const { installed, canInstall, installing, install } = usePwaInstall();
  const [showHelp, setShowHelp] = useState(false);
  const [message, setMessage] = useState("");

  const isIos =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  const handleInstall = async () => {
    setMessage("");

    try {
      const result = await install();

      if (result === "manual") {
        setShowHelp(true);
      } else if (result === "accepted") {
        setShowHelp(false);
        setMessage(
          "Installation accepted. Your browser will finish adding the app."
        );
      } else if (result === "dismissed") {
        setShowHelp(false);
        setMessage("You can install later using this button.");
      }
    } catch {
      setMessage("Could not open the installer. Please try again.");
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleInstall}
        disabled={installed || installing}
        className="flex w-full items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-left text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-default disabled:opacity-70"
      >
        {installed ? (
          <FaCheckCircle aria-hidden="true" className="shrink-0 text-lg" />
        ) : (
          <FaDownload aria-hidden="true" className="shrink-0 text-lg" />
        )}

        <span>
          <span className="block text-sm font-semibold">
            {installed
              ? "App installed"
              : installing
                ? "Opening installer…"
                : "Install App"}
          </span>

          <span className="mt-1 block text-xs text-blue-600">
            {installed
              ? "Creative Career AI is ready"
              : "Add Career AI to your home screen"}
          </span>
        </span>
      </button>

      <p
        role="status"
        aria-live="polite"
        className={message ? "mt-2 text-xs text-gray-500" : "sr-only"}
      >
        {message}
      </p>

      {showHelp && !installed && (
        <section
          aria-labelledby="pwa-install-help"
          className="relative mt-3 rounded-xl border border-gray-200 bg-gray-50 p-4"
        >
          <button
            type="button"
            onClick={() => setShowHelp(false)}
            aria-label="Close install instructions"
            className="absolute right-2 top-2 rounded-lg p-2 text-gray-500 hover:bg-gray-200"
          >
            <FaTimes aria-hidden="true" />
          </button>

          <h3
            id="pwa-install-help"
            className="pr-8 text-sm font-semibold text-gray-900"
          >
            Install Creative Career AI
          </h3>

          {canInstall ? (
            <button
              type="button"
              onClick={handleInstall}
              disabled={installing}
              className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {installing ? "Opening installer…" : "Install now"}
            </button>
          ) : (
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-gray-600">
              {isIos ? (
                <>
                  <li>Open this website in Safari.</li>
                  <li>Tap Share, then select Add to Home Screen.</li>
                  <li>Tap Add to finish.</li>
                </>
              ) : (
                <>
                  <li>Open this website in Chrome or Edge.</li>
                  <li>
                    Open the browser menu and select Install app or Add to
                    Home screen, if available.
                  </li>
                  <li>Confirm the installation.</li>
                </>
              )}
            </ol>
          )}
        </section>
      )}
    </div>
  );
}