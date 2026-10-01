import { CheckIcon, LocateFixedIcon, MessagesSquareIcon, RotateCcwIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { OfflineUnavailable } from "@/features/offline/offline-unavailable";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { coverClass, initials } from "@/lib/cover";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useChapterComments, useResolveComment } from "./queries";

type Filter = "open" | "all";

type Props = {
  chapterId: string;
  activeId: string | null;
  onReveal(id: string): void;
};

export function ReviewsPanel({ chapterId, activeId, onReveal }: Props) {
  const { data: comments, isPending, fetchStatus } = useChapterComments(chapterId);
  const online = useOnlineStatus();
  const resolve = useResolveComment(chapterId);
  const [filter, setFilter] = useState<Filter>("open");
  const visible = comments?.filter((comment) => filter === "all" || !comment.resolvedAt) ?? [];

  useEffect(() => {
    if (activeId)
      document
        .getElementById(`comment-${activeId}`)
        ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeId]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={filter}
        onValueChange={(value) => (value === "open" || value === "all") && setFilter(value)}
      >
        <ToggleGroupItem value="open">À traiter</ToggleGroupItem>
        <ToggleGroupItem value="all">Tous</ToggleGroupItem>
      </ToggleGroup>

      {!comments && fetchStatus === "paused" && (
        <OfflineUnavailable title="Relectures indisponibles hors ligne" />
      )}
      {isPending && fetchStatus !== "paused" && <Skeleton className="h-24 w-full" />}

      {comments && visible.length === 0 && (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessagesSquareIcon />
            </EmptyMedia>
            <EmptyTitle>
              {comments.length === 0 ? "Pas encore de relecture" : "Tout est traité"}
            </EmptyTitle>
            <EmptyDescription>
              Figez une version puis partagez son lien : les commentaires de vos relecteurs
              apparaîtront ici.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <ol className="flex min-h-0 flex-col gap-3 overflow-y-auto pb-4">
        {visible.map((comment) => (
          <li
            key={comment.id}
            className={cn(
              "flex flex-col gap-2 rounded-md border bg-card p-3 text-sm",
              comment.resolvedAt && "opacity-60",
              activeId === comment.id && "border-primary ring-2 ring-primary/30",
            )}
            id={`comment-${comment.id}`}
          >
            <div className="flex items-center gap-2">
              <Avatar className="size-6">
                <AvatarFallback
                  className={cn(
                    "text-[0.65rem] text-cover-foreground",
                    coverClass(comment.reviewerName),
                  )}
                >
                  {initials(comment.reviewerName)}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{comment.reviewerName}</span>
              <span className="text-xs text-muted-foreground">
                {formatRelative(comment.createdAt)}
              </span>
            </div>
            {comment.quote &&
              (comment.resolvedAt ? (
                <blockquote className="line-clamp-3 border-l-2 pl-2 font-serif text-muted-foreground italic">
                  {comment.quote}
                </blockquote>
              ) : (
                <button
                  type="button"
                  onClick={() => onReveal(comment.id)}
                  title="Aller au passage dans le texte"
                  className="group/quote flex items-start gap-2 rounded-md border-l-2 border-primary/60 py-0.5 pr-1 pl-2 text-left transition-colors hover:bg-accent"
                >
                  <span className="line-clamp-3 flex-1 font-serif text-muted-foreground italic">
                    {comment.quote}
                  </span>
                  <LocateFixedIcon className="mt-0.5 size-3.5 shrink-0 text-primary opacity-60 group-hover/quote:opacity-100" />
                </button>
              ))}
            <p className="whitespace-pre-wrap">{comment.body}</p>
            <div className="flex items-center justify-between gap-2">
              <Badge variant="outline" className="truncate">
                {comment.versionLabel}
              </Badge>
              <Button
                variant="ghost"
                size="xs"
                disabled={!online}
                onClick={() => resolve.mutate({ id: comment.id, resolved: !comment.resolvedAt })}
              >
                {comment.resolvedAt ? (
                  <RotateCcwIcon data-icon="inline-start" />
                ) : (
                  <CheckIcon data-icon="inline-start" />
                )}
                {comment.resolvedAt ? "Rouvrir" : "Traité"}
              </Button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
