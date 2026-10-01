import { CloudOffIcon } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function OfflineUnavailable({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CloudOffIcon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>
          {description ??
            "Ce contenu n'a pas encore été ouvert sur cet appareil. Reconnectez-vous pour y accéder."}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
