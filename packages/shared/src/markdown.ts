import { Marked } from "marked";

const escapeHtml = (text: string) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const createRenderer = (xhtml: boolean) =>
  new Marked<string, string>({
    gfm: true,
    renderer: {
      html: ({ text }) => escapeHtml(text),
      image: ({ text }) => escapeHtml(text),
      hr: () => (xhtml ? "<hr />\n" : "<hr>\n"),
      br: () => (xhtml ? "<br />" : "<br>"),
    },
  });

const html = createRenderer(false);
const xhtml = createRenderer(true);

export function renderMarkdown(markdown: string, options: { xhtml?: boolean } = {}): string {
  return (options.xhtml ? xhtml : html).parse(markdown, { async: false });
}
