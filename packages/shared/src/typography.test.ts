import { describe, expect, it } from "vitest";
import {
  applyFrenchDashes,
  applyFrenchQuotes,
  applyFrenchTypography,
  NBSP,
  typographyInputChange,
} from "./typography";

describe("applyFrenchDashes", () => {
  it("transforme un tiret de début de ligne en tiret de dialogue", () => {
    expect(applyFrenchDashes("- Bonjour, dit-il.")).toBe("— Bonjour, dit-il.");
  });

  it("gère chaque ligne de dialogue indépendamment", () => {
    expect(applyFrenchDashes("- Tu viens ?\n- Oui.")).toBe("— Tu viens ?\n— Oui.");
  });

  it("transforme les incises entourées d'espaces", () => {
    expect(applyFrenchDashes("Il partit - sans un mot - vers la mer.")).toBe(
      "Il partit — sans un mot — vers la mer.",
    );
  });

  it("préserve les traits d'union", () => {
    expect(applyFrenchDashes("Peut-être viendra-t-il demain.")).toBe(
      "Peut-être viendra-t-il demain.",
    );
  });

  it("préserve les séparateurs markdown et les listes à puces étoilées", () => {
    const text = "Fin.\n\n---\n\n* un\n* deux";
    expect(applyFrenchDashes(text)).toBe(text);
  });

  it("conserve l'indentation devant un dialogue", () => {
    expect(applyFrenchDashes("  - Non.")).toBe("  — Non.");
  });
});

describe("applyFrenchQuotes", () => {
  it("remplace les guillemets droits par des guillemets français avec espaces insécables", () => {
    expect(applyFrenchQuotes('Il dit : "Viens."')).toBe(`Il dit : «${NBSP}Viens.${NBSP}»`);
  });

  it("absorbe les espaces déjà présentes à l'intérieur des guillemets", () => {
    expect(applyFrenchQuotes('" Oui "')).toBe(`«${NBSP}Oui${NBSP}»`);
  });

  it("convertit aussi les guillemets typographiques anglais", () => {
    expect(applyFrenchQuotes("“Non”, souffla-t-elle.")).toBe(
      `«${NBSP}Non${NBSP}», souffla-t-elle.`,
    );
  });

  it("ouvre après une parenthèse ou un tiret et ferme après un mot", () => {
    expect(applyFrenchQuotes('("mer")')).toBe(`(«${NBSP}mer${NBSP}»)`);
    expect(applyFrenchQuotes('—"Assez"')).toBe(`—«${NBSP}Assez${NBSP}»`);
  });

  it("tient compte du texte qui précède", () => {
    expect(applyFrenchQuotes('"', "Il murmura ")).toBe(`«${NBSP}`);
    expect(applyFrenchQuotes('"', `«${NBSP}Adieu`)).toBe(`${NBSP}»`);
  });
});

describe("applyFrenchTypography", () => {
  it("combine tirets et guillemets", () => {
    expect(applyFrenchTypography('- "Partez" - dit-il.')).toBe(
      `— «${NBSP}Partez${NBSP}» — dit-il.`,
    );
  });
});

describe("typographyInputChange", () => {
  it("remplace le tiret tapé en début de ligne lorsqu'on ajoute une espace", () => {
    expect(typographyInputChange("-", " ")).toEqual({ removeBefore: 1, insert: "— " });
    expect(typographyInputChange("  -", " ")).toEqual({ removeBefore: 1, insert: "— " });
  });

  it("remplace le tiret d'incise précédé d'une espace", () => {
    expect(typographyInputChange("Il partit -", " ")).toEqual({ removeBefore: 1, insert: "— " });
  });

  it("ouvre puis ferme des guillemets à la frappe", () => {
    expect(typographyInputChange("Il dit ", '"')).toEqual({ removeBefore: 0, insert: `«${NBSP}` });
    expect(typographyInputChange(`Il dit «${NBSP}oui`, '"')).toEqual({
      removeBefore: 0,
      insert: `${NBSP}»`,
    });
  });

  it("retire l'espace tapée avant un guillemet fermant", () => {
    expect(typographyInputChange(`«${NBSP}oui `, "»")).toEqual({
      removeBefore: 1,
      insert: `${NBSP}»`,
    });
  });

  it("gère une saisie de plusieurs caractères d'un coup", () => {
    expect(typographyInputChange("", '- Oui - "enfin".')).toEqual({
      removeBefore: 0,
      insert: `— Oui — «${NBSP}enfin${NBSP}».`,
    });
  });

  it("ignore les traits d'union et les autres saisies", () => {
    expect(typographyInputChange("peut-", " ")).toBeNull();
    expect(typographyInputChange("-", "a")).toBeNull();
    expect(typographyInputChange("--", " ")).toBeNull();
    expect(typographyInputChange("", " ")).toBeNull();
  });

  it("ne revient pas sur un tiret laissé volontairement plus tôt dans la ligne", () => {
    expect(typographyInputChange("a - b", "c")).toBeNull();
  });
});
