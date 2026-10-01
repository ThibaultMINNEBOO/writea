import { MinimizeIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Navigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ChapterEditor } from "@/features/editor/chapter-editor";
import type { MarkdownEditorHandle } from "@/features/editor/markdown-editor";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { ChapterSidebar } from "./chapter-sidebar";
import { useWork } from "./queries";
import { WorkspaceHeader } from "./workspace-header";

export function WorkspacePage() {
  const { workId = "", chapterId } = useParams();
  const { data: work, error } = useWork(workId);
  const [sidebarOpen, setSidebarOpen] = usePersistedState("writea:sidebar", true);
  const [typewriter, setTypewriter] = usePersistedState("writea:typewriter", false);
  const [focusMode, setFocusMode] = useState(false);
  const editorRef = useRef<MarkdownEditorHandle>(null);

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
          sidebarOpen={sidebarOpen}
          typewriter={typewriter}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onToggleTypewriter={() => setTypewriter(!typewriter)}
          onEnterFocus={() => setFocusMode(true)}
        />
      )}
      <div className="flex min-h-0 flex-1">
        {sidebarOpen && !focusMode && (
          <div className="hidden md:block">
            <ChapterSidebar work={work} activeId={chapterId} />
          </div>
        )}
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
              workId={work.id}
              chapterId={chapterId}
              typewriter={typewriter}
              focusMode={focusMode}
              editorRef={editorRef}
              onLookupWord={() => {}}
            />
          )}
        </main>
      </div>
    </div>
  );
}
