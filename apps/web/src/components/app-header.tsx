import type { ReactNode } from "react";
import { Link } from "react-router";
import { UserMenu } from "@/features/auth/user-menu";
import { ThemeToggle } from "@/features/theme/theme-toggle";

export function AppHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link to="/" className="font-serif text-xl font-semibold tracking-tight">
          Writea
        </Link>
        <div className="ml-auto flex items-center gap-1">
          {children}
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
