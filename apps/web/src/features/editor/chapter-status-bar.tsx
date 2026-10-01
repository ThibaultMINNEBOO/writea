import { CircleAlertIcon, CircleCheckIcon, TargetIcon } from "lucide-react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { useUpdateChapter } from "@/features/workspace/queries";
import type { Chapter } from "@/lib/api";
import { formatNumber, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SaveStatus } from "./use-autosave";

type Props = {
  chapter: Chapter;
  workId: string;
  wordCount: number;
  sessionWords: number;
  status: SaveStatus;
  subdued: boolean;
  onRetry(): void;
};

function SaveIndicator({ status, onRetry }: { status: SaveStatus; onRetry(): void }) {
  if (status === "error") {
    return (
      <Button variant="ghost" size="xs" onClick={onRetry} className="text-destructive">
        <CircleAlertIcon data-icon="inline-start" />
        Échec de l'enregistrement, réessayer
      </Button>
    );
  }
  if (status === "saved") {
    return (
      <span className="flex items-center gap-1.5">
        <CircleCheckIcon className="size-3.5" />
        Enregistré
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5">
      <Spinner className="size-3.5" />
      Enregistrement…
    </span>
  );
}

export function ChapterStatusBar({
  chapter,
  workId,
  wordCount,
  sessionWords,
  status,
  subdued,
  onRetry,
}: Props) {
  const updateChapter = useUpdateChapter(workId);
  const goal = chapter.wordGoal;
  const progress = goal ? Math.min(100, Math.round((wordCount / goal) * 100)) : 0;

  function handleGoalSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(new FormData(event.currentTarget).get("goal"));
    updateChapter.mutate({ id: chapter.id, wordGoal: value > 0 ? Math.round(value) : null });
  }

  return (
    <footer
      className={cn(
        "flex h-10 shrink-0 items-center gap-4 border-t px-4 text-xs text-muted-foreground transition-opacity",
        subdued && "border-transparent opacity-30 hover:opacity-100",
      )}
    >
      <span>{pluralize(wordCount, "mot")}</span>
      {sessionWords !== 0 && (
        <span>
          {sessionWords > 0 ? "+" : "−"}
          {formatNumber(Math.abs(sessionWords))} cette session
        </span>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="xs">
            <TargetIcon data-icon="inline-start" />
            {goal ? `${progress} % de ${formatNumber(goal)}` : "Fixer un objectif"}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64">
          <form onSubmit={handleGoalSubmit} className="flex flex-col gap-3">
            <Field>
              <FieldLabel htmlFor="goal">Objectif du chapitre</FieldLabel>
              <Input
                id="goal"
                name="goal"
                type="number"
                min={0}
                step={100}
                defaultValue={goal ?? ""}
                placeholder="3 000"
              />
              <FieldDescription>Nombre de mots visé. Laissez vide pour retirer.</FieldDescription>
            </Field>
            <Button type="submit" size="sm">
              Enregistrer
            </Button>
          </form>
        </PopoverContent>
      </Popover>
      {goal && <Progress value={progress} className="hidden w-32 sm:block" />}
      <div className="ml-auto">
        <SaveIndicator status={status} onRetry={onRetry} />
      </div>
    </footer>
  );
}
