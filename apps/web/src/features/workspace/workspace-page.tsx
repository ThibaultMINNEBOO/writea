import {
  BookDownIcon,
  BookOpenTextIcon,
  HistoryIcon,
  MessagesSquareIcon,
  MinimizeIcon,
  PanelRightIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useParams } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Toggle } from "@/components/ui/toggle";
import { ChapterEditor, type ChapterEditorHandle } from "@/features/editor/chapter-editor";
import { OfflineUnavailable } from "@/features/offline/offline-unavailable";
import { useChapterComments } from "@/features/review/queries";
import { ReviewsPanel } from "@/features/review/reviews-panel";
import { ShareControls } from "@/features/review/share-controls";
import { SynonymsPanel } from "@/features/synonyms/synonyms-panel";
import { VersionsPanel } from "@/features/versions/versions-panel";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { useResponsivePanel } from "@/hooks/use-responsive-panel";
import { epubUrl } from "@/lib/api";
import { ChapterSidebar } from "./chapter-sidebar";
import { useWork } from "./queries";
import { ToolsPanel, type ToolTab } from "./tools-panel";
import { WorkspaceHeader } from "./workspace-header";

export function WorkspacePage() {
  const { workId = "", chapterId } = useParams();
  const { data: work, error, fetchStatus } = useWork(workId);
  const sidebar = useResponsivePanel("writea:sidebar", "(min-width: 768px)");
  const [typewriter, setTypewriter] = usePersistedState("writea:typewriter", false);
  const [focusMode, setFocusMode] = useState(false);
  const tools = useResponsivePanel("writea:tools", "(min-width: 1024px)");
  const [toolTab, setToolTab] = useState<ToolTab>("synonyms");
  const [lookup, setLookup] = useState({ term: "", id: 0 });
  const editorRef = useRef<ChapterEditorHandle>(null);
  const online = useOnlineStatus();
  const { data: comments } = useChapterComments(chapterId ?? "");
  const openComments = comments?.filter((comment) => !comment.resolvedAt).length ?? 0;
  const quotedComments = useMemo(
    () =>
      comments
        ?.filter((comment) => !comment.resolvedAt && comment.quote)
        .map((comment) => ({ id: comment.id, quote: comment.quote, hint: comment.startOffset })) ??
      [],
    [comments],
  );
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

  function selectComment(id: string) {
    setActiveCommentId(id);
    setToolTab("reviews");
    tools.setOpen(true);
  }

  function revealComment(id: string) {
    setActiveCommentId(id);
    if (!tools.docked) tools.setOpen(false);
    if (!editorRef.current?.revealComment(id)) {
      toast.info("Passage introuvable", {
        description: "Le texte a été modifié depuis la version commentée.",
      });
    }
  }
  const [revision, setRevision] = useState(0);

  function lookupWord(term: string) {
    setLookup((previous) => ({ term, id: previous.id + 1 }));
    setToolTab("synonyms");
    tools.setOpen(true);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        setFocusMode((value) => !value);
      }
      if (event.key === "Escape") setFocusMode(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (error) return <Navigate to="/" replace />;
  if (!work && fetchStatus === "paused") {
    return (
      <div className="grid h-svh place-items-center p-4">
        <OfflineUnavailable title="Œuvre indisponible hors ligne" />
      </div>
    );
  }
  if (!work) {
    return (
      <div className="grid h-svh place-items-center">
        <Spinner />
      </div>
    );
  }

  const firstChapter = work.chapters[0];
  if (!chapterId && firstChapter) {
    return <Navigate to={`/oeuvres/${work.id}/chapitres/${firstChapter.id}`} replace />;
  }

  return (
    <div className="flex h-svh flex-col">
      {!focusMode && (
        <WorkspaceHeader
          title={work.title}
          sidebarOpen={sidebar.open}
          typewriter={typewriter}
          onToggleSidebar={() => sidebar.setOpen(!sidebar.open)}
          onToggleTypewriter={() => setTypewriter(!typewriter)}
          onEnterFocus={() => setFocusMode(true)}
          actions={
            <>
              {online ? (
                <Button variant="ghost" size="sm" asChild>
                  <a href={epubUrl(work.id)} download aria-label="Exporter en EPUB">
                    <BookDownIcon data-icon="inline-start" />
                    <span className="hidden sm:inline">EPUB</span>
                  </a>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled
                  aria-label="Export EPUB indisponible hors ligne"
                >
                  <BookDownIcon data-icon="inline-start" />
                  <span className="hidden sm:inline">EPUB</span>
                </Button>
              )}
              <Toggle
                size="sm"
                pressed={tools.open}
                onPressedChange={tools.setOpen}
                aria-label="Outils"
              >
                <PanelRightIcon />
              </Toggle>
            </>
          }
        />
      )}
      <div className="flex min-h-0 flex-1">
        {!focusMode &&
          (sidebar.docked ? (
            sidebar.open && <ChapterSidebar work={work} activeId={chapterId} />
          ) : (
            <Sheet open={sidebar.open} onOpenChange={sidebar.setOpen}>
              <SheetContent side="left" className="w-72 gap-0 p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Chapitres</SheetTitle>
                </SheetHeader>
                <ChapterSidebar
                  work={work}
                  activeId={chapterId}
                  className="w-full border-r-0 pt-8"
                  onNavigate={() => sidebar.setOpen(false)}
                />
              </SheetContent>
            </Sheet>
          ))}
        <main className="relative min-w-0 flex-1">
          {focusMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFocusMode(false)}
              className="absolute top-3 right-3 z-10 opacity-20 transition-opacity hover:opacity-100"
            >
              <MinimizeIcon data-icon="inline-start" />
              Quitter le mode focus
            </Button>
          )}
          {chapterId && (
            <ChapterEditor
              key={`${chapterId}:${revision}`}
              workId={work.id}
              chapterId={chapterId}
              typewriter={typewriter}
              focusMode={focusMode}
              editorRef={editorRef}
              onLookupWord={lookupWord}
              comments={quotedComments}
              onCommentSelect={selectComment}
            />
          )}
        </main>
        {!focusMode && (
          <ToolsPanel
            docked={tools.docked}
            open={tools.open}
            onOpenChange={tools.setOpen}
            tab={toolTab}
            onTabChange={setToolTab}
            tabs={[
              {
                value: "synonyms",
                label: "Synonymes",
                icon: BookOpenTextIcon,
                content: (
                  <SynonymsPanel
                    key={lookup.id}
                    initialTerm={lookup.term}
                    onPick={(synonym) => editorRef.current?.replaceWordAtCursor(synonym)}
                  />
                ),
              },
              ...(chapterId
                ? [
                    {
                      value: "versions" as const,
                      label: "Versions",
                      icon: HistoryIcon,
                      content: (
                        <VersionsPanel
                          workId={work.id}
                          chapterId={chapterId}
                          beforeSnapshot={async () => editorRef.current?.flush()}
                          onRestored={() => setRevision((value) => value + 1)}
                          renderShare={(version) => (
                            <ShareControls chapterId={chapterId} version={version} />
                          )}
                        />
                      ),
                    },
                    {
                      value: "reviews" as const,
                      label: "Relecture",
                      icon: MessagesSquareIcon,
                      badge: openComments,
                      content: (
                        <ReviewsPanel
                          chapterId={chapterId}
                          activeId={activeCommentId}
                          onReveal={revealComment}
                        />
                      ),
                    },
                  ]
                : []),
            ]}
          />
        )}
      </div>
    </div>
  );
}
