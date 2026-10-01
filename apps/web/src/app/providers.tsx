import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { type ReactNode, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PwaUpdater } from "@/features/pwa/pwa-updater";
import { ThemeProvider } from "@/features/theme/theme-provider";
import { PERSIST_MAX_AGE, queryPersister, shouldPersistQuery } from "@/lib/query-persistence";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, gcTime: PERSIST_MAX_AGE, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <ThemeProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: queryPersister,
          maxAge: PERSIST_MAX_AGE,
          buster: "v1",
          dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery },
        }}
      >
        <TooltipProvider>
          {children}
          <Toaster position="bottom-right" />
          <PwaUpdater />
        </TooltipProvider>
      </PersistQueryClientProvider>
    </ThemeProvider>
  );
}
