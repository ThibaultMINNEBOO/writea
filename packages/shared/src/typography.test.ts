import { describe, expect, it } from "vitest";
import { applyFrenchDashes, dashInputChange } from "./typography";

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

describe("dashInputChange", () => {
  it("remplace le tiret tapé en début de ligne lorsqu'on ajoute une espace", () => {
    expect(dashInputChange("-", " ")).toEqual({ removeBefore: 1, insert: "— " });
    expect(dashInputChange("  -", " ")).toEqual({ removeBefore: 1, insert: "— " });
  });

  it("remplace le tiret d'incise précédé d'une espace", () => {
    expect(dashInputChange("Il partit -", " ")).toEqual({ removeBefore: 1, insert: "— " });
  });

  it("gère une saisie de plusieurs caractères d'un coup", () => {
    expect(dashInputChange("", "- Oui - enfin.")).toEqual({
      removeBefore: 0,
      insert: "— Oui — enfin.",
    });
  });

  it("ignore les traits d'union et les autres saisies", () => {
    expect(dashInputChange("peut-", " ")).toBeNull();
    expect(dashInputChange("-", "a")).toBeNull();
    expect(dashInputChange("--", " ")).toBeNull();
    expect(dashInputChange("", " ")).toBeNull();
  });

  it("ne revient pas sur un tiret laissé volontairement plus tôt dans la ligne", () => {
    expect(dashInputChange("a - b", "c")).toBeNull();
  });
});
