import { describe, expect, it } from "vitest";
import { parseMyThes } from "./mythes";

const sample = `UTF-8
abaisser|1
(Verbe)|avilir|diminuer|abaisser|avilir
Été|2
(Nom)|saison|chaleur
(nom)|belle saison
vide|0
`;

describe("parseMyThes", () => {
  it("produit une entrée par sens avec la nature grammaticale", () => {
    expect(parseMyThes(sample)).toEqual([
      {
        key: "abaisser",
        word: "abaisser",
        partOfSpeech: "verbe",
        synonyms: ["avilir", "diminuer"],
      },
      { key: "ete", word: "Été", partOfSpeech: "nom", synonyms: ["saison", "chaleur"] },
      { key: "ete", word: "Été", partOfSpeech: "nom", synonyms: ["belle saison"] },
    ]);
  });
});
