import { TriangleAlertIcon } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function RouteError() {
  return (
    <div className="grid min-h-svh place-items-center p-4">
      <Empty className="max-w-md border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TriangleAlertIcon />
          </EmptyMedia>
          <EmptyTitle>Une erreur inattendue est survenue</EmptyTitle>
          <EmptyDescription>
            Votre texte est enregistré automatiquement. Rechargez la page pour reprendre.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link to="/">Retour à la bibliothèque</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}
