import { versionCreate } from "@writea/shared/schemas";
import { countWords } from "@writea/shared/text";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { Hono } from "hono";
import { chapters, chapterVersions, reviewComments, shareLinks } from "../db/schema";
import type { AuthedEnv } from "../env";
import { validate } from "../lib/validator";
import { requireUser } from "../middleware/context";
import { findOwnedChapter, findOwnedVersion } from "../services/ownership";

export const chapterVersionsRoutes = new Hono<AuthedEnv>()
  .use(requireUser)
  .get("/:id/versions", async (c) => {
    const chapter = await findOwnedChapter(c.var.db, c.var.user.id, c.req.param("id"));
    const [versions, links, comments] = await c.var.db.batch([
      c.var.db
        .select({
          id: chapterVersions.id,
          label: chapterVersions.label,
          wordCount: chapterVersions.wordCount,
          createdAt: chapterVersions.createdAt,
        })
        .from(chapterVersions)
        .where(eq(chapterVersions.chapterId, chapter.id))
        .orderBy(desc(chapterVersions.createdAt)),
      c.var.db
        .select({ versionId: shareLinks.versionId, token: shareLinks.token })
        .from(shareLinks)
        .innerJoin(chapterVersions, eq(chapterVersions.id, shareLinks.versionId))
        .where(and(eq(chapterVersions.chapterId, chapter.id), isNull(shareLinks.revokedAt))),
      c.var.db
        .select({ versionId: reviewComments.versionId, open: count() })
        .from(reviewComments)
        .innerJoin(chapterVersions, eq(chapterVersions.id, reviewComments.versionId))
        .where(and(eq(chapterVersions.chapterId, chapter.id), isNull(reviewComments.resolvedAt)))
        .groupBy(reviewComments.versionId),
    ]);
    const tokens = new Map(links.map((link) => [link.versionId, link.token]));
    const openComments = new Map(comments.map((row) => [row.versionId, row.open]));
    return c.json(
      versions.map((version) => ({
        ...version,
        shareToken: tokens.get(version.id) ?? null,
        openComments: openComments.get(version.id) ?? 0,
      })),
    );
  })
  .post("/:id/versions", validate("json", versionCreate), async (c) => {
    const chapter = await findOwnedChapter(c.var.db, c.var.user.id, c.req.param("id"));
    const { label, content } = c.req.valid("json");
    const [version] = await c.var.db
      .insert(chapterVersions)
      .values({
        chapterId: chapter.id,
        label,
        title: chapter.title,
        content: content ?? chapter.content,
        wordCount: content === undefined ? chapter.wordCount : countWords(content),
      })
      .returning({ id: chapterVersions.id });
    return c.json(version, 201);
  });

export const versionsRoutes = new Hono<AuthedEnv>()
  .use(requireUser)
  .post("/:id/restore", async (c) => {
    const version = await findOwnedVersion(c.var.db, c.var.user.id, c.req.param("id"));
    const chapter = await findOwnedChapter(c.var.db, c.var.user.id, version.chapterId);
    const [, restored] = await c.var.db.batch([
      c.var.db.insert(chapterVersions).values({
        chapterId: chapter.id,
        label: `Avant restauration de « ${version.label} »`,
        title: chapter.title,
        content: chapter.content,
        wordCount: chapter.wordCount,
      }),
      c.var.db
        .update(chapters)
        .set({ title: version.title, content: version.content, wordCount: version.wordCount })
        .where(eq(chapters.id, chapter.id))
        .returning(),
    ]);
    return c.json(restored[0] ?? chapter);
  })
  .delete("/:id", async (c) => {
    const version = await findOwnedVersion(c.var.db, c.var.user.id, c.req.param("id"));
    await c.var.db.delete(chapterVersions).where(eq(chapterVersions.id, version.id));
    return c.body(null, 204);
  });
