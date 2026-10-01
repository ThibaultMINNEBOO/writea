import { renderMarkdown } from "@writea/shared/markdown";
import { applyFrenchTypography } from "@writea/shared/typography";
import { strToU8, type Zippable, zipSync } from "fflate";

export type EpubBook = {
  id: string;
  title: string;
  subtitle: string | null;
  author: string;
  synopsis: string | null;
  modifiedAt: Date;
  chapters: { title: string; content: string }[];
};

const escapeXml = (text: string) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const chapterFile = (index: number) => `chapitre-${String(index + 1).padStart(3, "0")}.xhtml`;

const xhtmlPage = (title: string, body: string) => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="fr" lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>${escapeXml(title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css" />
</head>
<body>
${body}
</body>
</html>
`;

const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml" />
  </rootfiles>
</container>
`;

const stylesheet = `body { font-family: serif; line-height: 1.5; margin: 0 5%; }
h1 { font-size: 1.6em; text-align: center; margin: 3em 0 2em; page-break-before: always; }
h2, h3 { margin: 1.5em 0 0.75em; }
p { margin: 0; text-indent: 1.5em; text-align: justify; hyphens: auto; }
h1 + p, h2 + p, h3 + p, hr + p, blockquote + p { text-indent: 0; }
blockquote { margin: 1em 1.5em; font-style: italic; }
hr { border: 0; margin: 1.5em 0; text-align: center; }
hr::after { content: "⁂"; }
.title-page { text-align: center; margin-top: 30%; }
.title-page h1 { page-break-before: avoid; margin: 0 0 0.5em; font-size: 2em; }
.title-page .subtitle { font-style: italic; margin-bottom: 3em; }
.title-page .author { font-variant: small-caps; letter-spacing: 0.05em; }
`;

function titlePage(book: EpubBook) {
  const subtitle = book.subtitle ? `<p class="subtitle">${escapeXml(book.subtitle)}</p>` : "";
  return xhtmlPage(
    book.title,
    `<section class="title-page" epub:type="titlepage">
  <h1>${escapeXml(book.title)}</h1>
  ${subtitle}
  <p class="author">${escapeXml(book.author)}</p>
</section>`,
  );
}

function chapterPage(chapter: EpubBook["chapters"][number]) {
  const body = renderMarkdown(applyFrenchTypography(chapter.content), { xhtml: true });
  return xhtmlPage(
    chapter.title,
    `<section epub:type="chapter">
<h1>${escapeXml(chapter.title)}</h1>
${body}</section>`,
  );
}

function navPage(book: EpubBook) {
  const items = book.chapters
    .map(
      (chapter, index) =>
        `      <li><a href="${chapterFile(index)}">${escapeXml(chapter.title)}</a></li>`,
    )
    .join("\n");
  return xhtmlPage(
    "Table des matières",
    `<nav epub:type="toc" id="toc">
    <h1>Table des matières</h1>
    <ol>
${items}
    </ol>
  </nav>`,
  );
}

function packageDocument(book: EpubBook) {
  const modified = `${book.modifiedAt.toISOString().slice(0, 19)}Z`;
  const description = book.synopsis
    ? `\n    <dc:description>${escapeXml(book.synopsis)}</dc:description>`
    : "";
  const manifest = book.chapters
    .map(
      (_, index) =>
        `    <item id="ch${index + 1}" href="${chapterFile(index)}" media-type="application/xhtml+xml" />`,
    )
    .join("\n");
  const spine = book.chapters
    .map((_, index) => `    <itemref idref="ch${index + 1}" />`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id" xml:lang="fr">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="book-id">urn:uuid:${book.id}</dc:identifier>
    <dc:title>${escapeXml(book.title)}</dc:title>
    <dc:creator>${escapeXml(book.author)}</dc:creator>
    <dc:language>fr</dc:language>${description}
    <meta property="dcterms:modified">${modified}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav" />
    <item id="css" href="styles.css" media-type="text/css" />
    <item id="title" href="titre.xhtml" media-type="application/xhtml+xml" />
${manifest}
  </manifest>
  <spine>
    <itemref idref="title" />
    <itemref idref="nav" linear="no" />
${spine}
  </spine>
</package>
`;
}

export function buildEpub(book: EpubBook): Uint8Array<ArrayBuffer> {
  const files: Zippable = {
    mimetype: [strToU8("application/epub+zip"), { level: 0 }],
    "META-INF/container.xml": strToU8(containerXml),
    "OEBPS/content.opf": strToU8(packageDocument(book)),
    "OEBPS/nav.xhtml": strToU8(navPage(book)),
    "OEBPS/styles.css": strToU8(stylesheet),
    "OEBPS/titre.xhtml": strToU8(titlePage(book)),
  };
  book.chapters.forEach((chapter, index) => {
    files[`OEBPS/${chapterFile(index)}`] = strToU8(chapterPage(chapter));
  });
  return new Uint8Array(zipSync(files, { level: 9 }));
}
