import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { createAuth } from "../auth";
import { createDb } from "../db/client";
import type { AppEnv, AuthedEnv } from "../env";

export const withContext = createMiddleware<AppEnv>(async (c, next) => {
  const db = createDb(c.env.DB);
  c.set("db", db);
  const session = await createAuth(c.env, db).api.getSession({ headers: c.req.raw.headers });
  c.set("user", session?.user ?? null);
  await next();
});

export const requireUser = createMiddleware<AuthedEnv>(async (c, next) => {
  if (!c.get("user")) throw new HTTPException(401, { message: "Authentification requise" });
  await next();
});
