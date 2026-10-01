import { ArrowLeftIcon, FocusIcon, PanelLeftIcon, TypeIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UserMenu } from "@/features/auth/user-menu";
import { ThemeToggle } from "@/features/theme/theme-toggle";

type Props = {
  title: string;
  sidebarOpen: boolean;
  typewriter: boolean;
  onToggleSidebar(): void;
  onToggleTypewriter(): void;
  onEnterFocus(): void;
  actions?: ReactNode;
};

function WithTooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function WorkspaceHeader({
  title,
  sidebarOpen,
  typewriter,
  onToggleSidebar,
  onToggleTypewriter,
  onEnterFocus,
  actions,
}: Props) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-1 border-b px-2">
      <WithTooltip label="Bibliothèque">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link to="/" aria-label="Retour à la bibliothèque">
            <ArrowLeftIcon />
          </Link>
        </Button>
      </WithTooltip>
      <WithTooltip label={sidebarOpen ? "Masquer les chapitres" : "Afficher les chapitres"}>
        <Toggle
          size="sm"
          pressed={sidebarOpen}
          onPressedChange={onToggleSidebar}
          aria-label="Chapitres"
        >
          <PanelLeftIcon />
        </Toggle>
      </WithTooltip>
      <h1 className="truncate px-2 font-heading text-base font-semibold">{title}</h1>
      <div className="ml-auto flex items-center gap-1">
        {actions}
        <WithTooltip label="Défilement machine à écrire">
          <Toggle
            size="sm"
            pressed={typewriter}
            onPressedChange={onToggleTypewriter}
            aria-label="Machine à écrire"
          >
            <TypeIcon />
          </Toggle>
        </WithTooltip>
        <WithTooltip label="Mode focus (⌘⇧F)">
          <Button variant="ghost" size="icon-sm" onClick={onEnterFocus} aria-label="Mode focus">
            <FocusIcon />
          </Button>
        </WithTooltip>
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
