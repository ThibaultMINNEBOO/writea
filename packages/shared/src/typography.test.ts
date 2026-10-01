import { describe, expect, it } from "vitest";
import { applyFrenchDashes, dashReplacementForInput } from "./typography";

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

describe("dashReplacementForInput", () => {
  it("remplace le tiret tapé en début de ligne lorsqu'on ajoute une espace", () => {
    expect(dashReplacementForInput("-", " ")).toBe("— ");
    expect(dashReplacementForInput("  -", " ")).toBe("— ");
  });

  it("remplace le tiret d'incise précédé d'une espace", () => {
    expect(dashReplacementForInput("Il partit -", " ")).toBe("— ");
  });

  it("ignore les traits d'union et les autres saisies", () => {
    expect(dashReplacementForInput("peut-", " ")).toBeNull();
    expect(dashReplacementForInput("-", "a")).toBeNull();
    expect(dashReplacementForInput("--", " ")).toBeNull();
    expect(dashReplacementForInput("", " ")).toBeNull();
  });
});
