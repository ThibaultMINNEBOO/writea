import { LinkIcon, MessageSquarePlusIcon, MessageSquareTextIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "react-router";
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
import { ThemeToggle } from "@/features/theme/theme-toggle";
import { formatDate, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CommentDialog, type CommentDraft } from "./comment-dialog";
import { ManuscriptView, type TextSelection } from "./manuscript-view";
import { useSharedVersion } from "./queries";

function ReviewHeader() {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <span className="font-serif text-xl font-semibold tracking-tight">Writea</span>
        <Badge variant="secondary">Relecture</Badge>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export function ReviewPage() {
  const { token = "" } = useParams();
  const { data, isPending, isError } = useSharedVersion(token);
  const [selection, setSelection] = useState<TextSelection | null>(null);
  const [draft, setDraft] = useState<CommentDraft | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const anchors = useMemo(
    () =>
      data?.comments.map((comment) => ({
        id: comment.id,
        start: comment.startOffset,
        end: comment.endOffset,
      })) ?? [],
    [data?.comments],
  );

  function openDraft(next: CommentDraft) {
    setDraft(next);
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  }

  if (isError) {
    return (
      <>
        <ReviewHeader />
        <Empty className="mx-auto mt-16 max-w-md border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LinkIcon />
            </EmptyMedia>
            <EmptyTitle>Lien de relecture indisponible</EmptyTitle>
            <EmptyDescription>
              Ce lien a peut-être été révoqué par l'auteur. Demandez-lui un nouveau lien.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </>
    );
  }

  return (
    <>
      <ReviewHeader />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <main className="mx-auto w-full max-w-[68ch]">
          {isPending || !data ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <>
              <div className="mb-10 flex flex-col gap-2 border-b pb-6">
                <p className="text-sm text-muted-foreground">
                  {data.workTitle} · par {data.author}
                </p>
                <h1 className="font-serif text-4xl font-semibold tracking-tight">{data.title}</h1>
                <p className="text-sm text-muted-foreground">
                  Version « {data.label} » du {formatDate(data.createdAt)} ·{" "}
                  {pluralize(data.wordCount, "mot")}
                </p>
                <p className="mt-2 text-sm">
                  Sélectionnez un passage pour le commenter. Vos remarques sont transmises à
                  l'auteur.
                </p>
              </div>
              <ManuscriptView
                markdown={data.content}
                anchors={anchors}
                activeId={activeId}
                onSelectionChange={setSelection}
              />
            </>
          )}
        </main>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:max-h-[calc(100svh-8rem)]">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">
              {data ? pluralize(data.comments.length, "commentaire") : "Commentaires"}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openDraft({ start: 0, end: 0, quote: "" })}
              disabled={!data}
            >
              <MessageSquareTextIcon data-icon="inline-start" />
              Remarque générale
            </Button>
          </div>
          <ol className="flex min-h-0 flex-col gap-3 overflow-y-auto">
            {data?.comments.map((comment) => (
              <li key={comment.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(comment.id)}
                  className={cn(
                    "flex w-full flex-col gap-2 rounded-md border bg-card p-3 text-left text-sm transition-colors hover:border-primary",
                    activeId === comment.id && "border-primary",
                    comment.resolved && "opacity-60",
                  )}
                >
                  {comment.quote && (
                    <span className="line-clamp-2 border-l-2 pl-2 font-serif text-muted-foreground italic">
                      {comment.quote}
                    </span>
                  )}
                  <span className="whitespace-pre-wrap">{comment.body}</span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    {comment.reviewerName} · {formatDate(comment.createdAt)}
                    {comment.resolved && <Badge variant="outline">Traité</Badge>}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </aside>
      </div>

      {selection && (
        <Button
          size="sm"
          className="absolute z-20 -translate-x-1/2 shadow-lg"
          style={{
            top: selection.rect.top + window.scrollY - 44,
            left: selection.rect.left + selection.rect.width / 2,
          }}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => openDraft(selection)}
        >
          <MessageSquarePlusIcon data-icon="inline-start" />
          Commenter
        </Button>
      )}

      <CommentDialog token={token} draft={draft} onClose={() => setDraft(null)} />
    </>
  );
}
