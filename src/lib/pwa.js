let deferredPrompt = null;
let initialized = false;

const subscribers = new Set();

let snapshot = {
  installed: false,
  canInstall: false,
  installing: false,
};

function update(next) {
  snapshot = { ...snapshot, ...next };
  subscribers.forEach((listener) => listener());
}

export function initializePwa() {
  if (initialized || typeof window === "undefined") return;

  initialized = true;

  const standalone = window.matchMedia("(display-mode: standalone)");
  const fullscreen = window.matchMedia("(display-mode: fullscreen)");

  const isStandalone = () =>
    standalone.matches ||
    fullscreen.matches ||
    navigator.standalone === true;

  update({ installed: isStandalone() });

  const checkDisplayMode = () => {
    if (isStandalone()) {
      deferredPrompt = null;

      update({
        installed: true,
        canInstall: false,
        installing: false,
      });
    }
  };

  standalone.addEventListener?.("change", checkDisplayMode);
  fullscreen.addEventListener?.("change", checkDisplayMode);

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();

    if (isStandalone()) return;

    deferredPrompt = event;

    update({
      canInstall: true,
      installed: false,
    });
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;

    update({
      installed: true,
      canInstall: false,
      installing: false,
    });
  });

  if (
    import.meta.env.PROD &&
    "serviceWorker" in navigator &&
    window.isSecureContext
  ) {
    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        })
        .catch((error) => {
          console.error("PWA service worker registration failed:", error);
        });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }
}

export function subscribePwa(listener) {
  subscribers.add(listener);

  return () => subscribers.delete(listener);
}

export function getPwaSnapshot() {
  return snapshot;
}

export async function installPwa() {
  if (snapshot.installed) return "installed";
  if (snapshot.installing) return "busy";
  if (!deferredPrompt) return "manual";

  const event = deferredPrompt;

  deferredPrompt = null;

  update({
    canInstall: false,
    installing: true,
  });

  try {
    await event.prompt();

    const choice = await event.userChoice;

    return choice.outcome;
  } catch (error) {
    console.error("PWA install prompt failed:", error);

    return "manual";
  } finally {
    update({ installing: false });
  }
}