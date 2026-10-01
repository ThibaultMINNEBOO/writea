import { normalizeWord } from "@writea/shared/text";

export type ThesaurusRow = {
  key: string;
  word: string;
  partOfSpeech: string | null;
  synonyms: string[];
};

const POS = /^\((.*)\)$/;

export function parseMyThes(source: string): ThesaurusRow[] {
  const rows: ThesaurusRow[] = [];
  const lines = source.split(/\r?\n/).slice(1);
  let word: string | null = null;

  for (const line of lines) {
    if (!line.trim()) continue;
    const [head = "", ...rest] = line.split("|");
    const pos = POS.exec(head);
    if (!pos) {
      word = head.trim();
      continue;
    }
    if (!word) continue;
    const self = normalizeWord(word);
    const synonyms = [...new Set(rest.map((s) => s.trim()))].filter(
      (s) => s && normalizeWord(s) !== self,
    );
    if (synonyms.length === 0) continue;
    rows.push({
      key: self,
      word,
      partOfSpeech: pos[1]?.trim().toLocaleLowerCase("fr") || null,
      synonyms,
    });
  }
  return rows;
}
