import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { createAuth } from "./auth";
import { createDb } from "./db/client";
import type { AppEnv } from "./env";
import { withContext } from "./middleware/context";

const app = new Hono<AppEnv>()
  .basePath("/api")
  .use("*", (c, next) => cors({ origin: c.env.APP_URL, credentials: true })(c, next))
  .on(["GET", "POST"], "/auth/*", (c) => createAuth(c.env, createDb(c.env.DB)).handler(c.req.raw))
  .use("*", withContext)
  .get("/health", (c) => c.json({ ok: true }));

app.onError((err, c) => {
  if (err instanceof HTTPException) return c.json({ error: err.message }, err.status);
  console.error(err);
  return c.json({ error: "Erreur interne" }, 500);
});

app.notFound((c) => c.json({ error: "Ressource introuvable" }, 404));

export type AppType = typeof app;

export default app;
