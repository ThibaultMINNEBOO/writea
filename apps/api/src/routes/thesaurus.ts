import { thesaurusQuery } from "@writea/shared/schemas";
import { normalizeWord } from "@writea/shared/text";
import { inArray } from "drizzle-orm";
import { Hono } from "hono";
import { thesaurus } from "../db/schema";
import type { AuthedEnv } from "../env";
import { validate } from "../lib/validator";
import { requireUser } from "../middleware/context";

type Meaning = { id: number; partOfSpeech: string | null; synonyms: string[] };
type Entry = { word: string; meanings: Meaning[] };

const singular = (key: string) => (/[sx]$/.test(key) && key.length > 3 ? key.slice(0, -1) : key);

export const thesaurusRoutes = new Hono<AuthedEnv>()
  .use(requireUser)
  .get("/", validate("query", thesaurusQuery), async (c) => {
    const query = c.req.valid("query").q;
    const key = normalizeWord(query);
    const rows = await c.var.db
      .select()
      .from(thesaurus)
      .where(inArray(thesaurus.key, [...new Set([key, singular(key)])]))
      .limit(50);

    const lowered = query.toLocaleLowerCase("fr");
    const entries = new Map<string, Entry>();
    for (const row of rows) {
      const entry = entries.get(row.word) ?? { word: row.word, meanings: [] };
      entry.meanings.push({ id: row.id, partOfSpeech: row.partOfSpeech, synonyms: row.synonyms });
      entries.set(row.word, entry);
    }
    const ranked = [...entries.values()].sort(
      (a, b) =>
        Number(b.word.toLocaleLowerCase("fr") === lowered) -
        Number(a.word.toLocaleLowerCase("fr") === lowered),
    );

    c.header("Cache-Control", "private, max-age=86400");
    return c.json({ query, entries: ranked });
  });
