import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { NavLink, useNavigate } from "react-router";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useOnlineStatus } from "@/hooks/use-online-status";
import type { ChapterSummary, WorkDetail } from "@/lib/api";
import { formatNumber, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCreateChapter, useDeleteChapter, useReorderChapters } from "./queries";

type ItemProps = {
  chapter: ChapterSummary;
  number: number;
  workId: string;
  canDelete: boolean;
  onDelete(id: string): void;
  onNavigate?(): void;
};

function SortableChapter({ chapter, number, workId, canDelete, onDelete, onNavigate }: ItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: chapter.id,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("group relative", isDragging && "z-10 opacity-80")}
    >
      <NavLink
        to={`/oeuvres/${workId}/chapitres/${chapter.id}`}
        onClick={onNavigate}
        className={({ isActive }) =>
          cn(
            "group/link flex items-start gap-2.5 rounded-lg py-2 pr-8 pl-2 text-sm transition-colors hover:bg-accent",
            isActive && "bg-accent text-accent-foreground shadow-xs",
          )
        }
      >
        <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary/15 font-heading text-xs font-semibold text-primary transition-opacity group-hover:opacity-0 group-aria-[current=page]/link:bg-primary group-aria-[current=page]/link:text-primary-foreground">
          {number}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate font-medium">{chapter.title}</span>
          <span className="text-xs text-muted-foreground">
            {pluralize(chapter.wordCount, "mot")}
            {chapter.wordGoal ? ` / ${formatNumber(chapter.wordGoal)}` : ""}
          </span>
          {chapter.wordGoal ? (
            <span className="mt-1 h-1 overflow-hidden rounded-full bg-primary/15">
              <span
                className="block h-full rounded-full bg-primary transition-[width] duration-500"
                style={{
                  width: `${Math.min(100, (chapter.wordCount / chapter.wordGoal) * 100)}%`,
                }}
              />
            </span>
          ) : null}
        </span>
      </NavLink>
      <button
        type="button"
        aria-label={`Déplacer ${chapter.title}`}
        className="absolute top-2.5 left-3 cursor-grab text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon className="size-4" />
      </button>
      {canDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Supprimer ${chapter.title}`}
              className="absolute top-1/2 right-1 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            >
              <Trash2Icon />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer « {chapter.title} » ?</AlertDialogTitle>
              <AlertDialogDescription>
                Le chapitre, ses versions et les commentaires de relecture seront définitivement
                supprimés.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={() => onDelete(chapter.id)}>
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </li>
  );
}

type Props = {
  work: WorkDetail;
  activeId?: string;
  className?: string;
  onNavigate?(): void;
};

export function ChapterSidebar({ work, activeId, className, onNavigate }: Props) {
  const navigate = useNavigate();
  const createChapter = useCreateChapter(work.id);
  const online = useOnlineStatus();
  const deleteChapter = useDeleteChapter(work.id);
  const reorder = useReorderChapters(work.id);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const totalWords = work.chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0);

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const ids = work.chapters.map((chapter) => chapter.id);
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    reorder.mutate(next);
  }

  function handleCreate() {
    createChapter.mutate(undefined, {
      onSuccess: (chapter) => {
        navigate(`/oeuvres/${work.id}/chapitres/${chapter.id}`);
        onNavigate?.();
      },
    });
  }

  function handleDelete(id: string) {
    deleteChapter.mutate(id, {
      onSuccess: () => {
        if (id !== activeId) return;
        const fallback = work.chapters.find((chapter) => chapter.id !== id);
        navigate(fallback ? `/oeuvres/${work.id}/chapitres/${fallback.id}` : `/oeuvres/${work.id}`);
      },
    });
  }

  return (
    <aside
      className={cn(
        "flex h-full w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground",
        className,
      )}
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex flex-col">
          <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Chapitres
          </span>
          <span className="text-xs text-muted-foreground">{pluralize(totalWords, "mot")}</span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Nouveau chapitre"
          onClick={handleCreate}
          disabled={createChapter.isPending || !online}
        >
          <PlusIcon />
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={work.chapters} strategy={verticalListSortingStrategy}>
            <ol className="flex flex-col gap-0.5 p-2">
              {work.chapters.map((chapter, index) => (
                <SortableChapter
                  key={chapter.id}
                  chapter={chapter}
                  number={index + 1}
                  workId={work.id}
                  canDelete={online && work.chapters.length > 1}
                  onDelete={handleDelete}
                  onNavigate={onNavigate}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      </ScrollArea>
    </aside>
  );
}
