import { describe, expect, it } from "vitest";
import { locateQuote } from "./locate";

const slice = (source: string, range: { from: number; to: number } | null) =>
  range ? source.slice(range.from, range.to) : null;

describe("locateQuote", () => {
  it("retrouve un passage cité dans le texte source", () => {
    const source = "Le port s'éveillait à peine. La brume collait aux mâts.";
    expect(slice(source, locateQuote(source, "La brume collait"))).toBe("La brume collait");
  });

  it("ignore la syntaxe markdown absente du rendu", () => {
    const source = "La brume, *lourde et salée*, collait aux mâts.";
    expect(slice(source, locateQuote(source, "lourde et salée, collait"))).toBe(
      "lourde et salée*, collait",
    );
  });

  it("tolère les retours à la ligne et les espaces insécables", () => {
    const source = "Il cria : « Larguez ».\n— Non !";
    expect(slice(source, locateQuote(source, "« Larguez ». — Non"))).toBe("« Larguez ».\n— Non");
  });

  it("assimile guillemets droits et français", () => {
    const source = 'Il dit "Adieu" puis partit.';
    expect(slice(source, locateQuote(source, "« Adieu »"))).toBe('"Adieu"');
  });

  it("choisit l'occurrence la plus proche de la position d'origine", () => {
    const source = "Oui. Non. Oui. Non. Oui.";
    expect(locateQuote(source, "Oui", 11)).toEqual({ from: 10, to: 13 });
  });

  it("renvoie null si le passage a disparu", () => {
    expect(locateQuote("Texte réécrit.", "Ancien passage")).toBeNull();
    expect(locateQuote("Texte", "   ")).toBeNull();
  });
});
