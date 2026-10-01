import { type KeyboardEvent, useState } from "react";
import { useUpdateChapter } from "@/features/workspace/queries";
import type { Chapter } from "@/lib/api";

export function ChapterTitle({ chapter, workId }: { chapter: Chapter; workId: string }) {
  const [title, setTitle] = useState(chapter.title);
  const updateChapter = useUpdateChapter(workId);

  function commit() {
    const next = title.trim();
    if (!next) return setTitle(chapter.title);
    if (next !== chapter.title) updateChapter.mutate({ id: chapter.id, title: next });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") event.currentTarget.blur();
    if (event.key === "Escape") {
      setTitle(chapter.title);
      event.currentTarget.blur();
    }
  }

  return (
    <div className="mx-auto w-full max-w-[68ch] px-6 pt-10">
      <input
        aria-label="Titre du chapitre"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className="w-full bg-transparent font-serif text-4xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground"
        placeholder="Titre du chapitre"
      />
    </div>
  );
}
