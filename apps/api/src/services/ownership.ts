import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import type { Database } from "../db/client";
import { chapters, chapterVersions, works } from "../db/schema";

const notFound = (what: string) => new HTTPException(404, { message: `${what} introuvable` });

export async function findOwnedWork(db: Database, userId: string, workId: string) {
  const work = await db.query.works.findFirst({
    where: and(eq(works.id, workId), eq(works.userId, userId)),
  });
  if (!work) throw notFound("Œuvre");
  return work;
}

export async function findOwnedChapter(db: Database, userId: string, chapterId: string) {
  const [row] = await db
    .select({ chapter: chapters })
    .from(chapters)
    .innerJoin(works, eq(works.id, chapters.workId))
    .where(and(eq(chapters.id, chapterId), eq(works.userId, userId)))
    .limit(1);
  if (!row) throw notFound("Chapitre");
  return row.chapter;
}

export async function findOwnedVersion(db: Database, userId: string, versionId: string) {
  const [row] = await db
    .select({ version: chapterVersions, workId: works.id })
    .from(chapterVersions)
    .innerJoin(chapters, eq(chapters.id, chapterVersions.chapterId))
    .innerJoin(works, eq(works.id, chapters.workId))
    .where(and(eq(chapterVersions.id, versionId), eq(works.userId, userId)))
    .limit(1);
  if (!row) throw notFound("Version");
  return row.version;
}
