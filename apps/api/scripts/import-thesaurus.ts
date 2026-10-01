import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseMyThes, type ThesaurusRow } from "../src/services/mythes";

const SOURCE_URL =
  "https://raw.githubusercontent.com/LibreOffice/dictionaries/master/fr_FR/dictionaries/thes_fr.dat";
const ROWS_PER_INSERT = 100;
const outDir = path.resolve(import.meta.dirname, "../.thesaurus");
const sourceFile = path.join(outDir, "thes_fr.dat");
const sqlFile = path.join(outDir, "thesaurus.sql");

const quote = (value: string | null) =>
  value === null ? "NULL" : `'${value.replaceAll("'", "''")}'`;

const toValues = (row: ThesaurusRow) =>
  `(${quote(row.key)}, ${quote(row.word)}, ${quote(row.partOfSpeech)}, ${quote(JSON.stringify(row.synonyms))})`;

async function loadSource() {
  if (existsSync(sourceFile)) return readFile(sourceFile, "utf8");
  console.log(`Téléchargement de ${SOURCE_URL}`);
  const response = await fetch(SOURCE_URL);
  if (!response.ok) throw new Error(`Téléchargement impossible (${response.status})`);
  const text = await response.text();
  await writeFile(sourceFile, text);
  return text;
}

await mkdir(outDir, { recursive: true });
const rows = parseMyThes(await loadSource());
const statements = ["DELETE FROM thesaurus;"];
for (let i = 0; i < rows.length; i += ROWS_PER_INSERT) {
  const values = rows
    .slice(i, i + ROWS_PER_INSERT)
    .map(toValues)
    .join(",\n");
  statements.push(`INSERT INTO thesaurus (key, word, part_of_speech, synonyms) VALUES\n${values};`);
}
await writeFile(sqlFile, `${statements.join("\n")}\n`);
console.log(`${rows.length} sens écrits dans ${path.relative(process.cwd(), sqlFile)}`);
