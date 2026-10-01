import { BookOpenIcon, FeatherIcon, LayersIcon, type LucideIcon, PenLineIcon } from "lucide-react";
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
import { authClient } from "@/lib/auth-client";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CreateWorkDialog } from "./create-work-dialog";
import { useWorks } from "./queries";
import { WorkCard } from "./work-card";

type StatProps = { icon: LucideIcon; label: string; value: number; tone: string };

function Stat({ icon: Icon, label, value, tone }: StatProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card/70 px-4 py-3 shadow-xs backdrop-blur">
      <span className={cn("grid size-9 place-items-center rounded-lg", tone)}>
        <Icon className="size-4.5" />
      </span>
      <div className="flex flex-col">
        <span className="font-heading text-xl leading-none font-semibold">
          {formatNumber(value)}
        </span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

const greeting = () => (new Date().getHours() < 18 ? "Bonjour" : "Bonsoir");

export function LibraryPage() {
  const { data: works, isPending } = useWorks();
  const { data: session } = authClient.useSession();
  const firstName = session?.user.name.split(" ")[0] ?? "";
  const totals = (works ?? []).reduce(
    (sum, work) => ({
      words: sum.words + work.wordCount,
      chapters: sum.chapters + work.chapterCount,
    }),
    { words: 0, chapters: 0 },
  );
  const hasWorks = works !== undefined && works.length > 0;

  return (
    <div className="bg-paper min-h-svh">
      <AppHeader />
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10">
        <section className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <p className="flex items-center gap-2 text-sm font-medium text-primary">
              <FeatherIcon className="size-4" />
              {greeting()}
              {firstName && `, ${firstName}`}
            </p>
            <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
              Mes œuvres
            </h1>
            <p className="max-w-prose text-muted-foreground">
              Reprenez un manuscrit ou commencez une nouvelle histoire.
            </p>
          </div>
          {hasWorks && <CreateWorkDialog />}
        </section>

        {hasWorks && (
          <section className="grid gap-3 sm:grid-cols-3">
            <Stat
              icon={BookOpenIcon}
              label="œuvres en cours"
              value={works.length}
              tone="bg-cover-1/15 text-cover-1"
            />
            <Stat
              icon={LayersIcon}
              label="chapitres"
              value={totals.chapters}
              tone="bg-cover-3/15 text-cover-3"
            />
            <Stat
              icon={PenLineIcon}
              label="mots écrits"
              value={totals.words}
              tone="bg-cover-2/15 text-cover-2"
            />
          </section>
        )}

        {isPending && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        )}

        {works?.length === 0 && (
          <Empty className="border bg-card/70">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FeatherIcon />
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

        {hasWorks && (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {works.map((work, index) => (
              <WorkCard key={work.id} work={work} index={index} />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
