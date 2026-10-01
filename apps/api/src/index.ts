import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { createAuth } from "./auth";
import { createDb } from "./db/client";
import type { AppEnv } from "./env";
import { withContext } from "./middleware/context";
import { chaptersRoutes } from "./routes/chapters";
import { reviewRoutes } from "./routes/review";
import { chapterCommentsRoutes, commentsRoutes, versionSharingRoutes } from "./routes/sharing";
import { thesaurusRoutes } from "./routes/thesaurus";
import { chapterVersionsRoutes, versionsRoutes } from "./routes/versions";
import { worksRoutes } from "./routes/works";

const app = new Hono<AppEnv>()
  .basePath("/api")
  .use("*", (c, next) => cors({ origin: c.env.APP_URL, credentials: true })(c, next))
  .on(["GET", "POST"], "/auth/*", (c) => createAuth(c.env, createDb(c.env.DB)).handler(c.req.raw))
  .use("*", withContext)
  .get("/health", (c) => c.json({ ok: true }))
  .route("/works", worksRoutes)
  .route("/chapters", chaptersRoutes)
  .route("/chapters", chapterVersionsRoutes)
  .route("/chapters", chapterCommentsRoutes)
  .route("/versions", versionsRoutes)
  .route("/versions", versionSharingRoutes)
  .route("/comments", commentsRoutes)
  .route("/review", reviewRoutes)
  .route("/thesaurus", thesaurusRoutes);

app.onError((err, c) => {
  if (err instanceof HTTPException) return c.json({ error: err.message }, err.status);
  console.error(err);
  return c.json({ error: "Erreur interne" }, 500);
});

app.notFound((c) => c.json({ error: "Ressource introuvable" }, 404));

export type AppType = typeof app;

export default app;
