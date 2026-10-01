import {
  BookDownIcon,
  ClockIcon,
  EllipsisIcon,
  LayersIcon,
  PenLineIcon,
  Trash2Icon,
} from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { epubUrl, type WorkSummary } from "@/lib/api";
import { coverClass, initials } from "@/lib/cover";
import { formatNumber, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useDeleteWork } from "./queries";

export function WorkCard({ work, index }: { work: WorkSummary; index: number }) {
  const deleteWork = useDeleteWork();

  return (
    <article
      className="group relative flex animate-in gap-4 rounded-xl border bg-card p-4 text-card-foreground shadow-xs transition-all duration-300 fill-mode-both fade-in slide-in-from-bottom-2 hover:-translate-y-0.5 hover:shadow-md"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div
        className={cn(
          "relative flex h-28 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md text-cover-foreground shadow-md transition-transform duration-300 group-hover:-rotate-2",
          coverClass(work.id),
        )}
        aria-hidden
      >
        <span className="absolute inset-y-0 left-1.5 w-px bg-white/30" />
        <span className="font-heading text-2xl font-semibold">{initials(work.title)}</span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 className="font-heading text-xl leading-tight font-semibold">
          <Link to={`/oeuvres/${work.id}`} className="after:absolute after:inset-0">
            {work.title}
          </Link>
        </h2>
        <p className="truncate text-sm text-muted-foreground">
          {work.subtitle ? `${work.subtitle} · ` : ""}
          {work.author}
        </p>
        <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <LayersIcon className="size-3.5" />
            {formatNumber(work.chapterCount)}
          </span>
          <span className="flex items-center gap-1">
            <PenLineIcon className="size-3.5" />
            {formatNumber(work.wordCount)} mots
          </span>
          <span className="flex items-center gap-1">
            <ClockIcon className="size-3.5" />
            {formatRelative(work.updatedAt)}
          </span>
        </div>
      </div>

      <div className="relative z-10 -mt-1 -mr-1">
        <AlertDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Actions">
                <EllipsisIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <a href={epubUrl(work.id)} download>
                    <BookDownIcon />
                    Exporter en EPUB
                  </a>
                </DropdownMenuItem>
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
      </div>
    </article>
  );
}
