import { chapterUpdate } from "@writea/shared/schemas";
import { contentFingerprint, countWords } from "@writea/shared/text";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { chapters, chapterVersions, works } from "../db/schema";
import type { AuthedEnv } from "../env";
import { validate } from "../lib/validator";
import { requireUser } from "../middleware/context";
import { findOwnedChapter } from "../services/ownership";

export const chaptersRoutes = new Hono<AuthedEnv>()
  .use(requireUser)
  .get("/:id", async (c) => {
    const chapter = await findOwnedChapter(c.var.db, c.var.user.id, c.req.param("id"));
    return c.json(chapter);
  })
  .patch("/:id", validate("json", chapterUpdate), async (c) => {
    const chapter = await findOwnedChapter(c.var.db, c.var.user.id, c.req.param("id"));
    const { baseFingerprint, ...changes } = c.req.valid("json");
    const wordCount = changes.content === undefined ? undefined : countWords(changes.content);
    const conflictSaved =
      changes.content !== undefined &&
      baseFingerprint !== undefined &&
      changes.content !== chapter.content &&
      contentFingerprint(chapter.content) !== baseFingerprint;

    if (conflictSaved) {
      await c.var.db.insert(chapterVersions).values({
        chapterId: chapter.id,
        label: "Copie avant synchronisation hors ligne",
        title: chapter.title,
        content: chapter.content,
        wordCount: chapter.wordCount,
      });
    }

    const [updated] = await c.var.db.batch([
      c.var.db
        .update(chapters)
        .set({ ...changes, wordCount })
        .where(eq(chapters.id, chapter.id))
        .returning(),
      c.var.db.update(works).set({ updatedAt: new Date() }).where(eq(works.id, chapter.workId)),
    ]);
    return c.json({ ...(updated[0] ?? chapter), conflictSaved });
  })
  .delete("/:id", async (c) => {
    const chapter = await findOwnedChapter(c.var.db, c.var.user.id, c.req.param("id"));
    await c.var.db.delete(chapters).where(eq(chapters.id, chapter.id));
    return c.body(null, 204);
  });
