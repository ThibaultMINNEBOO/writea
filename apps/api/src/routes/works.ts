import { chapterCreate, chapterOrder, workInput, workUpdate } from "@writea/shared/schemas";
import { and, asc, count, desc, eq, inArray, max, sql, sum } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { chapters, works } from "../db/schema";
import type { AuthedEnv } from "../env";
import { validate } from "../lib/validator";
import { requireUser } from "../middleware/context";
import { findOwnedWork } from "../services/ownership";

const chapterSummary = {
  id: chapters.id,
  title: chapters.title,
  position: chapters.position,
  wordCount: chapters.wordCount,
  wordGoal: chapters.wordGoal,
  updatedAt: chapters.updatedAt,
};

export const worksRoutes = new Hono<AuthedEnv>()
  .use(requireUser)
  .get("/", async (c) => {
    const rows = await c.var.db
      .select({
        id: works.id,
        title: works.title,
        subtitle: works.subtitle,
        author: works.author,
        updatedAt: works.updatedAt,
        chapterCount: count(chapters.id),
        wordCount: sql<number>`coalesce(${sum(chapters.wordCount)}, 0)`.mapWith(Number),
      })
      .from(works)
      .leftJoin(chapters, eq(chapters.workId, works.id))
      .where(eq(works.userId, c.var.user.id))
      .groupBy(works.id)
      .orderBy(desc(works.updatedAt));
    return c.json(rows);
  })
  .post("/", validate("json", workInput), async (c) => {
    const input = c.req.valid("json");
    const [work] = await c.var.db
      .insert(works)
      .values({ ...input, userId: c.var.user.id })
      .returning();
    if (!work) throw new HTTPException(500, { message: "Création impossible" });
    await c.var.db.insert(chapters).values({ workId: work.id, title: "Chapitre 1", position: 0 });
    return c.json(work, 201);
  })
  .get("/:id", async (c) => {
    const work = await findOwnedWork(c.var.db, c.var.user.id, c.req.param("id"));
    const chapterList = await c.var.db
      .select(chapterSummary)
      .from(chapters)
      .where(eq(chapters.workId, work.id))
      .orderBy(asc(chapters.position));
    return c.json({ ...work, chapters: chapterList });
  })
  .patch("/:id", validate("json", workUpdate), async (c) => {
    const work = await findOwnedWork(c.var.db, c.var.user.id, c.req.param("id"));
    const [updated] = await c.var.db
      .update(works)
      .set(c.req.valid("json"))
      .where(eq(works.id, work.id))
      .returning();
    return c.json(updated);
  })
  .delete("/:id", async (c) => {
    const work = await findOwnedWork(c.var.db, c.var.user.id, c.req.param("id"));
    await c.var.db.delete(works).where(eq(works.id, work.id));
    return c.body(null, 204);
  })
  .post("/:id/chapters", validate("json", chapterCreate), async (c) => {
    const work = await findOwnedWork(c.var.db, c.var.user.id, c.req.param("id"));
    const [last] = await c.var.db
      .select({ position: max(chapters.position), total: count() })
      .from(chapters)
      .where(eq(chapters.workId, work.id));
    const position = (last?.position ?? -1) + 1;
    const [chapter] = await c.var.db
      .insert(chapters)
      .values({
        workId: work.id,
        title: c.req.valid("json").title ?? `Chapitre ${(last?.total ?? 0) + 1}`,
        position,
      })
      .returning(chapterSummary);
    await c.var.db.update(works).set({ updatedAt: new Date() }).where(eq(works.id, work.id));
    return c.json(chapter, 201);
  })
  .put("/:id/chapters/order", validate("json", chapterOrder), async (c) => {
    const work = await findOwnedWork(c.var.db, c.var.user.id, c.req.param("id"));
    const { chapterIds } = c.req.valid("json");
    const owned = await c.var.db
      .select({ id: chapters.id })
      .from(chapters)
      .where(and(eq(chapters.workId, work.id), inArray(chapters.id, chapterIds)));
    if (owned.length !== chapterIds.length) {
      throw new HTTPException(400, { message: "Ordre des chapitres invalide" });
    }
    const [first, ...rest] = chapterIds.map((id, position) =>
      c.var.db.update(chapters).set({ position }).where(eq(chapters.id, id)),
    );
    if (first) await c.var.db.batch([first, ...rest]);
    return c.body(null, 204);
  });
