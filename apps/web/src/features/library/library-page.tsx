import { BookOpenIcon } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/format";
import { CreateWorkDialog } from "./create-work-dialog";
import { useWorks } from "./queries";
import { WorkCard } from "./work-card";

export function LibraryPage() {
  const { data: works, isPending } = useWorks();
  const totalWords = works?.reduce((sum, work) => sum + work.wordCount, 0) ?? 0;

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-serif text-4xl tracking-tight">Mes œuvres</h1>
            {works && works.length > 0 && (
              <p className="text-muted-foreground">
                {formatNumber(totalWords)} mots écrits au total
              </p>
            )}
          </div>
          {works && works.length > 0 && <CreateWorkDialog />}
        </div>

        {isPending && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
          </div>
        )}

        {works?.length === 0 && (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BookOpenIcon />
              </EmptyMedia>
              <EmptyTitle>La page blanche vous attend</EmptyTitle>
              <EmptyDescription>
                Créez votre première œuvre et commencez à écrire votre premier chapitre.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <CreateWorkDialog />
            </EmptyContent>
          </Empty>
        )}

        {works && works.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {works.map((work) => (
              <WorkCard key={work.id} work={work} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
