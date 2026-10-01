import { useEffect } from "react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { authClient } from "@/lib/auth-client";

const STORAGE_KEY = "writea:user";

export type CurrentUser = { id: string; name: string; email: string };

function readCachedUser(): CurrentUser | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    return value &&
      typeof value === "object" &&
      "id" in value &&
      "name" in value &&
      "email" in value
      ? { id: String(value.id), name: String(value.name), email: String(value.email) }
      : null;
  } catch {
    return null;
  }
}

export function forgetCachedUser() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

/**
 * Returns the signed-in user, falling back to the last known user when the session cannot be
 * checked because the network is unavailable. The server still enforces authentication.
 */
export function useCurrentUser(): { user: CurrentUser | null; isPending: boolean } {
  const { data, isPending, error } = authClient.useSession();
  const online = useOnlineStatus();
  const sessionUser = data?.user;

  useEffect(() => {
    if (!sessionUser) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ id: sessionUser.id, name: sessionUser.name, email: sessionUser.email }),
      );
    } catch {}
  }, [sessionUser]);

  if (sessionUser) return { user: sessionUser, isPending: false };
  if (!online || error) {
    const cached = readCachedUser();
    if (cached) return { user: cached, isPending: false };
  }
  return { user: null, isPending: isPending && online };
}
