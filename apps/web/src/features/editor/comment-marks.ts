import { type Extension, StateEffect, StateField } from "@codemirror/state";
import { Decoration, type DecorationSet, EditorView } from "@codemirror/view";

export type CommentRange = { id: string; from: number; to: number };

export const setCommentRanges = StateEffect.define<CommentRange[]>();
export const flashRange = StateEffect.define<{ from: number; to: number } | null>();

const flashMark = Decoration.mark({ class: "cm-comment-flash" });

export const commentRangesField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(ranges, tr) {
    let next = ranges.map(tr.changes);
    for (const effect of tr.effects) {
      if (!effect.is(setCommentRanges)) continue;
      next = Decoration.set(
        effect.value
          .filter((range) => range.to > range.from)
          .map((range) =>
            Decoration.mark({
              class: "cm-comment-mark",
              attributes: { "data-comment-id": range.id, title: "Voir le commentaire" },
            }).range(range.from, range.to),
          ),
        true,
      );
    }
    return next;
  },
  provide: (field) => EditorView.decorations.from(field),
});

const flashField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(flash, tr) {
    let next = flash.map(tr.changes);
    for (const effect of tr.effects) {
      if (!effect.is(flashRange)) continue;
      next = effect.value
        ? Decoration.set([flashMark.range(effect.value.from, effect.value.to)])
        : Decoration.none;
    }
    return next;
  },
  provide: (field) => EditorView.decorations.from(field),
});

export function findCommentRange(view: EditorView, id: string): CommentRange | null {
  let found: CommentRange | null = null;
  view.state.field(commentRangesField).between(0, view.state.doc.length, (from, to, mark) => {
    if (mark.spec.attributes?.["data-comment-id"] !== id) return;
    found = { id, from, to };
    return false;
  });
  return found;
}

export function commentMarks(onSelect: (id: string) => void): Extension {
  return [
    commentRangesField,
    flashField,
    EditorView.domEventHandlers({
      click(event) {
        const target =
          event.target instanceof Element ? event.target.closest("[data-comment-id]") : null;
        const id = target?.getAttribute("data-comment-id");
        if (id) onSelect(id);
        return false;
      },
    }),
    EditorView.baseTheme({
      ".cm-comment-mark": {
        backgroundColor: "color-mix(in oklab, var(--primary) 16%, transparent)",
        borderBottom: "2px solid color-mix(in oklab, var(--primary) 70%, transparent)",
        cursor: "pointer",
      },
      ".cm-comment-flash": {
        backgroundColor: "color-mix(in oklab, var(--primary) 45%, transparent)",
        borderRadius: "2px",
      },
    }),
  ];
}
