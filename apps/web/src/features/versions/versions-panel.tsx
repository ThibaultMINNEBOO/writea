import { EllipsisIcon, HistoryIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { formatDate, pluralize } from "@/lib/format";
import { useCreateVersion, useDeleteVersion, useRestoreVersion, useVersions } from "./queries";

type Props = {
  workId: string;
  chapterId: string;
  beforeSnapshot(): Promise<void>;
  onRestored(): void;
  renderShare?(version: { id: string; shareToken: string | null }): ReactNode;
};

export function VersionsPanel({
  workId,
  chapterId,
  beforeSnapshot,
  onRestored,
  renderShare,
}: Props) {
  const { data: versions, isPending } = useVersions(chapterId);
  const createVersion = useCreateVersion(chapterId);
  const restoreVersion = useRestoreVersion(chapterId, workId);
  const deleteVersion = useDeleteVersion(chapterId);
  const [label, setLabel] = useState("");
  const [toRestore, setToRestore] = useState<{ id: string; label: string } | null>(null);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await beforeSnapshot();
    const fallback = `Version du ${formatDate(new Date())}`;
    createVersion.mutate(label.trim() || fallback, {
      onSuccess: () => {
        setLabel("");
        toast.success("Version figée");
      },
    });
  }

  async function handleRestore() {
    if (!toRestore) return;
    await beforeSnapshot();
    restoreVersion.mutate(toRestore.id, {
      onSuccess: () => {
        onRestored();
        toast.success(`« ${toRestore.label} » restaurée`, {
          description: "Votre texte précédent a été conservé dans une version.",
        });
      },
    });
    setToRestore(null);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <form onSubmit={handleCreate}>
        <Field>
          <FieldLabel htmlFor="version-label">Figer l'état actuel</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="version-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Premier jet, avant relecture…"
              maxLength={120}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton type="submit" disabled={createVersion.isPending}>
                {createVersion.isPending ? <Spinner /> : "Figer"}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <FieldDescription>
            Une version est un instantané que vous pouvez restaurer ou partager pour relecture.
          </FieldDescription>
        </Field>
      </form>

      {isPending && <Skeleton className="h-20 w-full" />}

      {versions?.length === 0 && (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HistoryIcon />
            </EmptyMedia>
            <EmptyTitle>Aucune version</EmptyTitle>
            <EmptyDescription>
              Figez votre chapitre avant une réécriture importante.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {versions && versions.length > 0 && (
        <ol className="flex min-h-0 flex-col gap-2 overflow-y-auto pb-4">
          {versions.map((version) => (
            <li key={version.id} className="flex flex-col gap-2 rounded-md border bg-card p-3">
              <div className="flex items-start gap-2">
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{version.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(version.createdAt)} · {pluralize(version.wordCount, "mot")}
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-xs" aria-label="Actions sur la version">
                      <EllipsisIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuGroup>
                      <DropdownMenuItem onSelect={() => setToRestore(version)}>
                        <RotateCcwIcon />
                        Restaurer
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => deleteVersion.mutate(version.id)}
                      >
                        <Trash2Icon />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {version.openComments > 0 && (
                <Badge variant="secondary" className="self-start">
                  {pluralize(version.openComments, "commentaire")} à traiter
                </Badge>
              )}
              {renderShare?.(version)}
            </li>
          ))}
        </ol>
      )}

      <AlertDialog open={toRestore !== null} onOpenChange={(open) => !open && setToRestore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurer « {toRestore?.label} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le texte actuel du chapitre sera remplacé. Il reste récupérable : une version
              automatique est créée juste avant la restauration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore}>Restaurer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
