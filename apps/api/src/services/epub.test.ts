import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { buildEpub } from "./epub";

const book = buildEpub({
  id: "1b4e28ba-2fa1-11d2-883f-0016d3cca427",
  title: "Le Grand Large",
  subtitle: "roman",
  author: "Jeanne & Co",
  synopsis: null,
  modifiedAt: new Date("2026-10-01T10:00:00.000Z"),
  chapters: [
    { title: "Le départ", content: "- Tu pars ?\n\nIl partit - enfin." },
    { title: "La <traversée>", content: "Le *large*." },
  ],
});

describe("buildEpub", () => {
  it("place le mimetype en premier, sans compression", () => {
    const view = new DataView(book.buffer, book.byteOffset);
    expect(view.getUint32(0, true)).toBe(0x04034b50);
    expect(view.getUint16(8, true)).toBe(0);
    expect(strFromU8(book.subarray(30, 38))).toBe("mimetype");
  });

  it("décrit l'ouvrage en français dans le manifeste", () => {
    const files = unzipSync(book);
    const opf = strFromU8(files["OEBPS/content.opf"] ?? new Uint8Array());
    expect(opf).toContain("<dc:language>fr</dc:language>");
    expect(opf).toContain("<dc:creator>Jeanne &amp; Co</dc:creator>");
    expect(opf).toContain('<meta property="dcterms:modified">2026-10-01T10:00:00Z</meta>');
  });

  it("produit un fichier XHTML par chapitre avec la typographie française", () => {
    const files = unzipSync(book);
    const first = strFromU8(files["OEBPS/chapitre-001.xhtml"] ?? new Uint8Array());
    expect(first).toContain("<p>— Tu pars ?</p>");
    expect(first).toContain("Il partit — enfin.");
    const second = strFromU8(files["OEBPS/chapitre-002.xhtml"] ?? new Uint8Array());
    expect(second).toContain("<h1>La &lt;traversée&gt;</h1>");
    expect(Object.keys(files)).toContain("OEBPS/nav.xhtml");
  });
});
