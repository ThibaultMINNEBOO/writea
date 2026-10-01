import { EllipsisIcon, Trash2Icon } from "lucide-react";
import { Link } from "react-router";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { WorkSummary } from "@/lib/api";
import { formatRelative, pluralize } from "@/lib/format";
import { useDeleteWork } from "./queries";

export function WorkCard({ work }: { work: WorkSummary }) {
  const deleteWork = useDeleteWork();

  return (
    <Card className="relative transition-shadow hover:shadow-md">
      <CardHeader>
        <CardTitle className="font-serif text-xl">
          <Link to={`/oeuvres/${work.id}`} className="after:absolute after:inset-0">
            {work.title}
          </Link>
        </CardTitle>
        <CardDescription>{work.subtitle ?? `par ${work.author}`}</CardDescription>
        <CardAction className="relative z-10">
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Actions">
                  <EllipsisIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem variant="destructive">
                      <Trash2Icon />
                      Supprimer
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer « {work.title} » ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tous les chapitres, versions et commentaires de relecture seront définitivement
                  supprimés.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={() => deleteWork.mutate(work.id)}>
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardAction>
      </CardHeader>
      <CardFooter className="mt-auto justify-between text-sm text-muted-foreground">
        <span>
          {pluralize(work.chapterCount, "chapitre")} · {pluralize(work.wordCount, "mot")}
        </span>
        <span>{formatRelative(work.updatedAt)}</span>
      </CardFooter>
    </Card>
  );
}
