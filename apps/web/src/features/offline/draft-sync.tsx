import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { syncDrafts } from "./sync";

export function DraftSync() {
  const queryClient = useQueryClient();
  const online = useOnlineStatus();

  useEffect(() => {
    if (online) void syncDrafts(queryClient);
  }, [online, queryClient]);

  return null;
}
