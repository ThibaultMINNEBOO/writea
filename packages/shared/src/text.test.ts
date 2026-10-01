import { describe, expect, it } from "vitest";
import { countWords, normalizeWord } from "./text";

describe("countWords", () => {
  it("compte les mots d'un texte français", () => {
    expect(countWords("— Bonjour, dit-elle à l'enfant.")).toBe(4);
  });

  it("ignore la syntaxe markdown", () => {
    expect(countWords("# Chapitre premier\n\n**Il** était *une* fois.\n\n---")).toBe(6);
  });

  it("renvoie zéro pour un texte vide", () => {
    expect(countWords("   \n")).toBe(0);
  });
});

describe("normalizeWord", () => {
  it("met en minuscules et retire les accents", () => {
    expect(normalizeWord("  Éphémère ")).toBe("ephemere");
    expect(normalizeWord("Cœur")).toBe("cœur");
  });
});
