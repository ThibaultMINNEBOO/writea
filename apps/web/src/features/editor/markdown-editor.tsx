import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView, keymap, placeholder } from "@codemirror/view";
import { type Ref, useEffect, useImperativeHandle, useLayoutEffect, useRef } from "react";
import { formattingKeymap, typewriterScrolling, writingSetup } from "./extensions";

export type WordTarget = { from: number; to: number; text: string };

export type MarkdownEditorHandle = {
  wordAtCursor(): WordTarget | null;
  replaceWordAtCursor(text: string): void;
  focus(): void;
};

type Props = {
  initialValue: string;
  typewriter: boolean;
  onChange(value: string): void;
  onLookupWord(word: string): void;
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

export function MarkdownEditor({ initialValue, typewriter, onChange, onLookupWord, ref }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const typewriterCompartment = useRef(new Compartment());
  const callbacks = useRef({ onChange, onLookupWord });
  useLayoutEffect(() => {
    callbacks.current = { onChange, onLookupWord };
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
          placeholder("Il était une fois…"),
          typewriterCompartment.current.of(typewriter ? typewriterScrolling : []),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) callbacks.current.onChange(update.state.doc.toString());
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
    viewRef.current?.dispatch({
      effects: typewriterCompartment.current.reconfigure(typewriter ? typewriterScrolling : []),
    });
  }, [typewriter]);

  return <div ref={containerRef} className="h-full" />;
}
