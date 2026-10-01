import { markdown } from "@codemirror/lang-markdown";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorSelection, EditorState, type Extension } from "@codemirror/state";
import { EditorView, type KeyBinding } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { applyFrenchTypography, typographyInputChange } from "@writea/shared/typography";

export const frenchTypography: Extension = [
  EditorView.inputHandler.of((view, from, to, text) => {
    const line = view.state.doc.lineAt(from);
    const change = typographyInputChange(line.text.slice(0, from - line.from), text);
    if (!change) return false;
    const start = from - change.removeBefore;
    view.dispatch({
      changes: { from: start, to, insert: change.insert },
      selection: { anchor: start + change.insert.length },
      userEvent: "input.type",
    });
    return true;
  }),
  EditorView.clipboardInputFilter.of((text) => applyFrenchTypography(text)),
];

export const typewriterScrolling: Extension = EditorState.transactionExtender.of((tr) =>
  tr.docChanged || tr.selection
    ? { effects: EditorView.scrollIntoView(tr.newSelection.main.head, { y: "center" }) }
    : null,
);

const wrapSelection =
  (marker: string) =>
  (view: EditorView): boolean => {
    view.dispatch(
      view.state.changeByRange((range) => ({
        changes: [
          { from: range.from, insert: marker },
          { from: range.to, insert: marker },
        ],
        range: EditorSelection.range(range.from + marker.length, range.to + marker.length),
      })),
    );
    return true;
  };

export const formattingKeymap: KeyBinding[] = [
  { key: "Mod-b", run: wrapSelection("**") },
  { key: "Mod-i", run: wrapSelection("*") },
];

const highlightStyle = HighlightStyle.define([
  { tag: tags.heading1, fontSize: "1.7em", fontWeight: "700", lineHeight: "1.4" },
  { tag: tags.heading2, fontSize: "1.4em", fontWeight: "700" },
  { tag: [tags.heading3, tags.heading4, tags.heading5, tags.heading6], fontWeight: "700" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strong, fontWeight: "700" },
  { tag: tags.strikethrough, textDecoration: "line-through" },
  { tag: tags.quote, fontStyle: "italic", color: "var(--muted-foreground)" },
  {
    tag: [tags.processingInstruction, tags.meta, tags.contentSeparator],
    color: "var(--muted-foreground)",
    opacity: "0.6",
  },
  { tag: [tags.link, tags.url], color: "var(--primary)", textDecoration: "underline" },
  { tag: tags.monospace, fontFamily: "var(--font-mono)", fontSize: "0.9em" },
]);

const theme = EditorView.theme({
  "&": {
    backgroundColor: "transparent",
    color: "var(--foreground)",
    fontSize: "1.2rem",
    height: "100%",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": {
    fontFamily: "var(--font-serif)",
    lineHeight: "1.85",
    overflow: "auto",
  },
  ".cm-content": {
    maxWidth: "68ch",
    margin: "0 auto",
    padding: "3rem 1.5rem 45vh",
    caretColor: "var(--primary)",
  },
  ".cm-line": { padding: "0" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--primary)", borderLeftWidth: "2px" },
  "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, ::selection":
    { backgroundColor: "color-mix(in oklab, var(--primary) 25%, transparent) !important" },
  ".cm-placeholder": { color: "var(--muted-foreground)", fontStyle: "italic" },
});

export const writingSetup: Extension = [
  markdown(),
  syntaxHighlighting(highlightStyle),
  theme,
  EditorView.lineWrapping,
  EditorView.contentAttributes.of({ spellcheck: "true", lang: "fr", autocorrect: "on" }),
  frenchTypography,
];
