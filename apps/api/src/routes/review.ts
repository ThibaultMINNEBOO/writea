import { commentCreate } from "@writea/shared/schemas";
import { and, asc, eq, isNull } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { Database } from "../db/client";
import { chapters, chapterVersions, reviewComments, shareLinks, works } from "../db/schema";
import type { AppEnv } from "../env";
import { validate } from "../lib/validator";

async function findSharedVersion(db: Database, token: string) {
  const [row] = await db
    .select({
      versionId: chapterVersions.id,
      label: chapterVersions.label,
      title: chapterVersions.title,
      content: chapterVersions.content,
      wordCount: chapterVersions.wordCount,
      createdAt: chapterVersions.createdAt,
      workTitle: works.title,
      author: works.author,
    })
    .from(shareLinks)
    .innerJoin(chapterVersions, eq(chapterVersions.id, shareLinks.versionId))
    .innerJoin(chapters, eq(chapters.id, chapterVersions.chapterId))
    .innerJoin(works, eq(works.id, chapters.workId))
    .where(and(eq(shareLinks.token, token), isNull(shareLinks.revokedAt)))
    .limit(1);
  if (!row) throw new HTTPException(404, { message: "Ce lien de relecture n'est plus valide" });
  return row;
}

const publicComment = {
  id: reviewComments.id,
  reviewerName: reviewComments.reviewerName,
  quote: reviewComments.quote,
  startOffset: reviewComments.startOffset,
  endOffset: reviewComments.endOffset,
  body: reviewComments.body,
  createdAt: reviewComments.createdAt,
  resolved: reviewComments.resolvedAt,
};

export const reviewRoutes = new Hono<AppEnv>()
  .get("/:token", async (c) => {
    const version = await findSharedVersion(c.var.db, c.req.param("token"));
    const comments = await c.var.db
      .select(publicComment)
      .from(reviewComments)
      .where(eq(reviewComments.versionId, version.versionId))
      .orderBy(asc(reviewComments.startOffset), asc(reviewComments.createdAt));
    c.header("X-Robots-Tag", "noindex");
    return c.json({
      ...version,
      comments: comments.map(({ resolved, ...comment }) => ({
        ...comment,
        resolved: resolved !== null,
      })),
    });
  })
  .post("/:token/comments", validate("json", commentCreate), async (c) => {
    const version = await findSharedVersion(c.var.db, c.req.param("token"));
    const input = c.req.valid("json");
    const [comment] = await c.var.db
      .insert(reviewComments)
      .values({ ...input, versionId: version.versionId })
      .returning(publicComment);
    if (!comment) throw new HTTPException(500, { message: "Commentaire non enregistré" });
    const { resolved, ...rest } = comment;
    return c.json({ ...rest, resolved: resolved !== null }, 201);
  });
