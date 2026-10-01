import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./markdown";

describe("renderMarkdown", () => {
  it("rend les paragraphes et l'emphase", () => {
    expect(renderMarkdown("Il était *une* fois.")).toBe("<p>Il était <em>une</em> fois.</p>\n");
  });

  it("conserve les retours à la ligne simples", () => {
    expect(renderMarkdown("Il cria.\n— Non !")).toBe("<p>Il cria.<br>— Non !</p>\n");
    expect(renderMarkdown("a\nb", { xhtml: true })).toBe("<p>a<br />b</p>\n");
  });

  it("échappe le HTML brut", () => {
    expect(renderMarkdown('<script>alert("x")</script>')).not.toContain("<script>");
    expect(renderMarkdown("a <b>gras</b>")).toContain("&lt;b&gt;");
  });

  it("produit du XHTML valide sur demande", () => {
    expect(renderMarkdown("a\n\n---\n\nb", { xhtml: true })).toContain("<hr />");
    expect(renderMarkdown("![x](http://e.fr/i.png)", { xhtml: true })).not.toContain("<img");
  });
});
