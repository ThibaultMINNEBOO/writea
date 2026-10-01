import { FeatherIcon } from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/lib/utils";

function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <FeatherIcon className="size-4.5 -rotate-12" />
      </span>
      <span className="font-heading text-xl font-semibold tracking-tight">Writea</span>
    </span>
  );
}

export function Logo({ linked = true, className }: { linked?: boolean; className?: string }) {
  if (!linked) return <LogoMark className={className} />;
  return (
    <Link to="/" aria-label="Writea, accueil">
      <LogoMark className={className} />
    </Link>
  );
}
