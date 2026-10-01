import type { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/features/auth/user-menu";
import { OfflineBadge } from "@/features/offline/offline-badge";
import { InstallAppButton } from "@/features/pwa/install-app-button";
import { ThemeToggle } from "@/features/theme/theme-toggle";

export function AppHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Logo />
        <div className="ml-auto flex items-center gap-1">
          <OfflineBadge />
          {children}
          <InstallAppButton className="mr-1" />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
