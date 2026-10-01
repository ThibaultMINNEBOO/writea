import { useSyncExternalStore } from "react";
import { connectivity } from "@/lib/connectivity";

export const useOnlineStatus = () =>
  useSyncExternalStore(connectivity.subscribe, connectivity.isOnline);
