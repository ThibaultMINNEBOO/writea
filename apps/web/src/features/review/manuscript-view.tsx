import { renderMarkdown } from "@writea/shared/markdown";
import { useEffect, useMemo, useRef } from "react";
import { offsetsFromRange, rangeFromOffsets, type TextOffsets } from "./text-range";

export type TextSelection = TextOffsets & { quote: string; rect: DOMRect };

type Anchor = TextOffsets & { id: string };

type Props = {
  markdown: string;
  anchors: Anchor[];
  activeId: string | null;
  onSelectionChange(selection: TextSelection | null): void;
};

const supportsHighlights = () => typeof CSS !== "undefined" && "highlights" in CSS;

export function ManuscriptView({ markdown, anchors, activeId, onSelectionChange }: Props) {
  const articleRef = useRef<HTMLElement>(null);
  const html = useMemo(() => renderMarkdown(markdown), [markdown]);

  useEffect(() => {
    const root = articleRef.current;
    if (!root || !supportsHighlights()) return;
    const ranges = new Map<string, Range>();
    for (const anchor of anchors) {
      if (anchor.end <= anchor.start) continue;
      const range = rangeFromOffsets(root, anchor);
      if (range) ranges.set(anchor.id, range);
    }
    const active = activeId ? ranges.get(activeId) : undefined;
    CSS.highlights.set(
      "review-comment",
      new Highlight(...[...ranges.values()].filter((range) => range !== active)),
    );
    CSS.highlights.set("review-comment-active", new Highlight(...(active ? [active] : [])));
    return () => {
      CSS.highlights.delete("review-comment");
      CSS.highlights.delete("review-comment-active");
    };
  }, [anchors, activeId]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll only when the active comment changes
  useEffect(() => {
    const root = articleRef.current;
    const anchor = anchors.find((candidate) => candidate.id === activeId);
    if (!root || !anchor || anchor.end <= anchor.start) return;
    const rect = rangeFromOffsets(root, anchor)?.getBoundingClientRect();
    if (rect) window.scrollBy({ top: rect.top - window.innerHeight / 3, behavior: "smooth" });
  }, [activeId]);

  useEffect(() => {
    function handleSelection() {
      const root = articleRef.current;
      const selection = window.getSelection();
      if (!root || !selection || selection.isCollapsed || selection.rangeCount === 0) {
        onSelectionChange(null);
        return;
      }
      const range = selection.getRangeAt(0);
      if (!root.contains(range.commonAncestorContainer)) return onSelectionChange(null);
      const quote = range.toString().trim();
      if (!quote) return onSelectionChange(null);
      onSelectionChange({
        ...offsetsFromRange(root, range),
        quote,
        rect: range.getBoundingClientRect(),
      });
    }
    document.addEventListener("selectionchange", handleSelection);
    return () => document.removeEventListener("selectionchange", handleSelection);
  }, [onSelectionChange]);

  return (
    <article
      ref={articleRef}
      className="manuscript"
      lang="fr"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: renderMarkdown escapes raw HTML
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
