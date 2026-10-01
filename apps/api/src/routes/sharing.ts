import { commentUpdate } from "@writea/shared/schemas";
import { and, desc, eq, isNull } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { chapters, chapterVersions, reviewComments, shareLinks, works } from "../db/schema";
import type { AuthedEnv } from "../env";
import { createShareToken } from "../lib/token";
import { validate } from "../lib/validator";
import { requireUser } from "../middleware/context";
import { findOwnedChapter, findOwnedVersion } from "../services/ownership";

export const versionSharingRoutes = new Hono<AuthedEnv>()
  .use(requireUser)
  .post("/:id/share", async (c) => {
    const version = await findOwnedVersion(c.var.db, c.var.user.id, c.req.param("id"));
    const existing = await c.var.db.query.shareLinks.findFirst({
      where: and(eq(shareLinks.versionId, version.id), isNull(shareLinks.revokedAt)),
    });
    if (existing) return c.json({ token: existing.token });
    const token = createShareToken();
    await c.var.db.insert(shareLinks).values({ token, versionId: version.id });
    return c.json({ token }, 201);
  })
  .delete("/:id/share", async (c) => {
    const version = await findOwnedVersion(c.var.db, c.var.user.id, c.req.param("id"));
    await c.var.db
      .update(shareLinks)
      .set({ revokedAt: new Date() })
      .where(and(eq(shareLinks.versionId, version.id), isNull(shareLinks.revokedAt)));
    return c.body(null, 204);
  });

export const chapterCommentsRoutes = new Hono<AuthedEnv>()
  .use(requireUser)
  .get("/:id/comments", async (c) => {
    const chapter = await findOwnedChapter(c.var.db, c.var.user.id, c.req.param("id"));
    const rows = await c.var.db
      .select({
        id: reviewComments.id,
        versionId: reviewComments.versionId,
        versionLabel: chapterVersions.label,
        reviewerName: reviewComments.reviewerName,
        quote: reviewComments.quote,
        body: reviewComments.body,
        createdAt: reviewComments.createdAt,
        resolvedAt: reviewComments.resolvedAt,
      })
      .from(reviewComments)
      .innerJoin(chapterVersions, eq(chapterVersions.id, reviewComments.versionId))
      .where(eq(chapterVersions.chapterId, chapter.id))
      .orderBy(desc(reviewComments.createdAt));
    return c.json(rows);
  });

export const commentsRoutes = new Hono<AuthedEnv>()
  .use(requireUser)
  .patch("/:id", validate("json", commentUpdate), async (c) => {
    const [row] = await c.var.db
      .select({ id: reviewComments.id })
      .from(reviewComments)
      .innerJoin(chapterVersions, eq(chapterVersions.id, reviewComments.versionId))
      .innerJoin(chapters, eq(chapters.id, chapterVersions.chapterId))
      .innerJoin(works, eq(works.id, chapters.workId))
      .where(and(eq(reviewComments.id, c.req.param("id")), eq(works.userId, c.var.user.id)))
      .limit(1);
    if (!row) throw new HTTPException(404, { message: "Commentaire introuvable" });
    const [updated] = await c.var.db
      .update(reviewComments)
      .set({ resolvedAt: c.req.valid("json").resolved ? new Date() : null })
      .where(eq(reviewComments.id, row.id))
      .returning();
    return c.json(updated);
  });
