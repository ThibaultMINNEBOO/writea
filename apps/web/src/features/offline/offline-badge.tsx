import { CloudOffIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useOnlineStatus } from "@/hooks/use-online-status";

export function OfflineBadge() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="secondary" className="gap-1">
          <CloudOffIcon />
          Hors ligne
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        Vos modifications sont gardées sur cet appareil et seront synchronisées au retour du réseau.
      </TooltipContent>
    </Tooltip>
  );
}
