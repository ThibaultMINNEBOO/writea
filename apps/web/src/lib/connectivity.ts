import { onlineManager } from "@tanstack/react-query";

const PROBE_INTERVAL = 10_000;

let online = true;
let probe: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

async function probeServer() {
  try {
    const response = await fetch("/api/health", { cache: "no-store" });
    if (response.ok) setOnline(true);
  } catch {
    setOnline(false);
  }
}

function setOnline(next: boolean) {
  if (next === online) return;
  online = next;
  if (online) {
    clearInterval(probe);
    probe = undefined;
  } else {
    probe ??= setInterval(probeServer, PROBE_INTERVAL);
  }
  for (const listener of listeners) listener();
}

export const connectivity = {
  isOnline: () => online,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

/** Fetch used for API calls: a network failure means the server is unreachable. */
export const trackedFetch: typeof fetch = async (input, init) => {
  try {
    const response = await fetch(input, init);
    setOnline(true);
    return response;
  } catch (error) {
    if (error instanceof TypeError) setOnline(false);
    throw error;
  }
};

export function monitorConnectivity() {
  window.addEventListener("offline", () => setOnline(false));
  window.addEventListener("online", () => void probeServer());
  void probeServer();
  onlineManager.setEventListener((setQueriesOnline) =>
    connectivity.subscribe(() => setQueriesOnline(online)),
  );
}
