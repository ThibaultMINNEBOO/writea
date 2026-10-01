import { useSyncExternalStore } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type InstallPlatform = "ios" | "safari-mac" | "firefox" | "other";

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();

const notify = () => {
  for (const listener of listeners) listener();
};

const isInstallPrompt = (event: Event): event is BeforeInstallPromptEvent => "prompt" in event;

const standaloneQuery = () => window.matchMedia("(display-mode: standalone)");

function runsStandalone() {
  const iosStandalone = "standalone" in navigator && navigator.standalone === true;
  return iosStandalone || standaloneQuery().matches;
}

export function detectInstallPlatform(userAgent = navigator.userAgent): InstallPlatform {
  const isAppleTouch =
    /iPad|iPhone|iPod/.test(userAgent) ||
    (/Macintosh/.test(userAgent) && navigator.maxTouchPoints > 1);
  if (isAppleTouch) return "ios";
  if (/Firefox\//.test(userAgent)) return "firefox";
  if (
    /Macintosh/.test(userAgent) &&
    /Safari\//.test(userAgent) &&
    !/Chrome|Chromium|Edg\//.test(userAgent)
  ) {
    return "safari-mac";
  }
  return "other";
}

export function listenForInstallPrompt() {
  installed = runsStandalone();
  standaloneQuery().addEventListener("change", () => {
    installed = runsStandalone();
    notify();
  });
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    if (!isInstallPrompt(event)) return;
    deferredPrompt = event;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    installed = true;
    notify();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useInstallPrompt() {
  const canPrompt = useSyncExternalStore(subscribe, () => deferredPrompt !== null);
  const isInstalled = useSyncExternalStore(subscribe, () => installed);

  /** Opens the browser's install dialog; resolves to false when the browser offers none. */
  async function install() {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    notify();
    return outcome === "accepted";
  }

  return { canPrompt, isInstalled, install };
}
