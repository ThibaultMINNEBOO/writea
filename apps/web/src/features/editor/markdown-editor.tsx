import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { Compartment, EditorState, Transaction } from "@codemirror/state";
import { EditorView, keymap, placeholder } from "@codemirror/view";
import { locateQuote } from "@writea/shared/locate";
import { type Ref, useEffect, useImperativeHandle, useLayoutEffect, useRef } from "react";
import { commentMarks, findCommentRange, flashRange, setCommentRanges } from "./comment-marks";
import { formattingKeymap, typewriterScrolling, writingSetup } from "./extensions";

export type WordTarget = { from: number; to: number; text: string };

export type QuotedComment = { id: string; quote: string; hint: number };

export type MarkdownEditorHandle = {
  wordAtCursor(): WordTarget | null;
  replaceWordAtCursor(text: string): void;
  revealComment(id: string): boolean;
  /** Replaces the whole text with a newer server copy without reporting it as a local edit. */
  replaceContent(text: string): void;
  focus(): void;
};

type Props = {
  initialValue: string;
  typewriter: boolean;
  onChange(value: string): void;
  onLookupWord(word: string): void;
  comments: QuotedComment[];
  onCommentSelect(id: string): void;
  ref?: Ref<MarkdownEditorHandle>;
};

function wordAtCursor(view: EditorView): WordTarget | null {
  const { state } = view;
  const { main } = state.selection;
  const range = main.empty ? state.wordAt(main.head) : main;
  if (!range) return null;
  const text = state.sliceDoc(range.from, range.to).trim();
  return text ? { from: range.from, to: range.to, text } : null;
}

function matchCapitalization(original: string, replacement: string) {
  const first = original.charAt(0);
  const isCapitalized =
    first !== "" &&
    first === first.toLocaleUpperCase("fr") &&
    first !== first.toLocaleLowerCase("fr");
  return isCapitalized
    ? replacement.charAt(0).toLocaleUpperCase("fr") + replacement.slice(1)
    : replacement;
}

export function MarkdownEditor({
  initialValue,
  typewriter,
  onChange,
  onLookupWord,
  comments,
  onCommentSelect,
  ref,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const typewriterCompartment = useRef(new Compartment());
  const callbacks = useRef({ onChange, onLookupWord, onCommentSelect });
  useLayoutEffect(() => {
    callbacks.current = { onChange, onLookupWord, onCommentSelect };
  });

  useImperativeHandle(ref, () => ({
    wordAtCursor: () => (viewRef.current ? wordAtCursor(viewRef.current) : null),
    replaceWordAtCursor(text) {
      const view = viewRef.current;
      if (!view) return;
      const head = view.state.selection.main.head;
      const target = wordAtCursor(view) ?? { from: head, to: head, text: "" };
      const insert = matchCapitalization(target.text, text);
      view.dispatch({
        changes: { from: target.from, to: target.to, insert },
        selection: { anchor: target.from + insert.length },
        userEvent: "input.replace",
      });
      view.focus();
    },
    revealComment(id) {
      const view = viewRef.current;
      const range = view ? findCommentRange(view, id) : null;
      if (!view || !range) return false;
      view.dispatch({
        selection: { anchor: range.from, head: range.to },
        effects: [
          EditorView.scrollIntoView(range.from, { y: "center" }),
          flashRange.of({ from: range.from, to: range.to }),
        ],
      });
      view.focus();
      window.setTimeout(() => view.dispatch({ effects: flashRange.of(null) }), 1600);
      return true;
    },
    replaceContent(text) {
      const view = viewRef.current;
      if (!view) return;
      const head = Math.min(view.state.selection.main.head, text.length);
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: text },
        selection: { anchor: head },
        annotations: [Transaction.remote.of(true), Transaction.addToHistory.of(false)],
      });
    },
    focus: () => viewRef.current?.focus(),
  }));

  // biome-ignore lint/correctness/useExhaustiveDependencies: the editor owns its document after mount
  useEffect(() => {
    const parent = containerRef.current;
    if (!parent) return;

    const view = new EditorView({
      parent,
      state: EditorState.create({
        doc: initialValue,
        extensions: [
          history(),
          keymap.of([
            ...formattingKeymap,
            {
              key: "Mod-Shift-s",
              run: (target) => {
                const word = wordAtCursor(target);
                callbacks.current.onLookupWord(word?.text ?? "");
                return true;
              },
            },
            ...defaultKeymap,
            ...historyKeymap,
          ]),
          writingSetup,
          commentMarks((id) => callbacks.current.onCommentSelect(id)),
          placeholder("Il était une fois…"),
          typewriterCompartment.current.of(typewriter ? typewriterScrolling : []),
          EditorView.updateListener.of((update) => {
            const remote = update.transactions.every((tr) => tr.annotation(Transaction.remote));
            if (update.docChanged && !remote)
              callbacks.current.onChange(update.state.doc.toString());
          }),
        ],
      }),
    });
    viewRef.current = view;
    view.focus();

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const source = view.state.doc.toString();
    const ranges = comments.flatMap(({ id, quote, hint }) => {
      const range = locateQuote(source, quote, hint);
      return range ? [{ id, ...range }] : [];
    });
    view.dispatch({ effects: setCommentRanges.of(ranges) });
  }, [comments]);

  useEffect(() => {
    viewRef.current?.dispatch({
      effects: typewriterCompartment.current.reconfigure(typewriter ? typewriterScrolling : []),
    });
  }, [typewriter]);

  return <div ref={containerRef} className="h-full" />;
}
