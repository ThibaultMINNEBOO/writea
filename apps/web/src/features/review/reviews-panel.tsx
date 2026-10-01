import { CheckIcon, MessagesSquareIcon, RotateCcwIcon } from "lucide-react";
import { useState } from "react";
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
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useChapterComments, useResolveComment } from "./queries";

type Filter = "open" | "all";

export function ReviewsPanel({ chapterId }: { chapterId: string }) {
  const { data: comments, isPending } = useChapterComments(chapterId);
  const resolve = useResolveComment(chapterId);
  const [filter, setFilter] = useState<Filter>("open");
  const visible = comments?.filter((comment) => filter === "all" || !comment.resolvedAt) ?? [];

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

      {isPending && <Skeleton className="h-24 w-full" />}

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
            )}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">{comment.reviewerName}</span>
              <span className="text-xs text-muted-foreground">
                {formatRelative(comment.createdAt)}
              </span>
            </div>
            {comment.quote && (
              <blockquote className="line-clamp-3 border-l-2 pl-2 font-serif text-muted-foreground italic">
                {comment.quote}
              </blockquote>
            )}
            <p className="whitespace-pre-wrap">{comment.body}</p>
            <div className="flex items-center justify-between gap-2">
              <Badge variant="outline" className="truncate">
                {comment.versionLabel}
              </Badge>
              <Button
                variant="ghost"
                size="xs"
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
